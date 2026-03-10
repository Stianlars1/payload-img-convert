import type { CollectionBeforeOperationHook } from 'payload'
import type { ImageFormat, ResolvedConfig } from '../types.js'
import {
  FORMAT_EXTENSION_MAP,
  FORMAT_MIME_MAP,
  MIME_FORMAT_MAP,
  FORMAT_SELECTOR_FIELD_NAME,
  RESIZE_MAX_WIDTH_FIELD_NAME,
  RESIZE_MAX_HEIGHT_FIELD_NAME,
} from '../defaults.js'

const SKIP_MIMES = ['image/svg+xml', 'image/gif']

function isConvertibleImage(mimeType: string): boolean {
  return mimeType.startsWith('image/') && !SKIP_MIMES.includes(mimeType)
}

function replaceExtension(filename: string, newExt: string): string {
  const dotIndex = filename.lastIndexOf('.')
  const baseName = dotIndex > 0 ? filename.substring(0, dotIndex) : filename
  return `${baseName}${newExt}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertImage(
  sharp: (input: Buffer | ArrayBuffer) => any,
  input: Buffer,
  outputFormat: ImageFormat,
  outputOptions: Record<string, unknown>,
  resizeWidth?: number,
  resizeHeight?: number,
): Promise<{ data: Buffer; info: { size: number } }> {
  let pipeline = sharp(input)

  if (resizeWidth || resizeHeight) {
    pipeline = pipeline.resize({
      width: resizeWidth,
      height: resizeHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  return pipeline
    .toFormat(outputFormat, outputOptions)
    .toBuffer({ resolveWithObject: true })
}

export function createBeforeOperationHook(
  config: ResolvedConfig,
  collectionSlug: string,
): CollectionBeforeOperationHook {
  return async ({ operation, req, args }) => {
    if (operation !== 'create' && operation !== 'update') return

    const data = args?.data
    if (!data) return

    // Determine target format: UI selection takes priority, then default
    const selectedFormat = data?.[FORMAT_SELECTOR_FIELD_NAME] as ImageFormat | undefined
    const targetFormat: ImageFormat = selectedFormat || config.defaultFormat

    // Determine resize dimensions: per-image UI value > global config > no resize
    const resizeWidth = (data?.[RESIZE_MAX_WIDTH_FIELD_NAME] as number | undefined) ?? config.maxWidth
    const resizeHeight = (data?.[RESIZE_MAX_HEIGHT_FIELD_NAME] as number | undefined) ?? config.maxHeight

    // Get Sharp from Payload's managed instance
    const sharp = req.payload.config?.sharp
    if (!sharp) {
      req.payload.logger.warn(
        'payload-img-convert: Sharp is not available on req.payload.config.sharp. Skipping conversion.',
      )
      return
    }

    // Build format-specific options
    const formatSpecificOptions = config.formatOptions?.[targetFormat] ?? {}
    const outputOptions = {
      quality: config.quality,
      ...formatSpecificOptions,
    }

    // --- Max file size check (new uploads only) ---
    if (config.maxFileSize && req.file && req.file.size > config.maxFileSize) {
      req.payload.logger.warn(
        `payload-img-convert: File size (${req.file.size} bytes) exceeds maxFileSize (${config.maxFileSize} bytes). Skipping conversion.`,
      )
      return
    }

    // --- Re-conversion: update operation with no new file uploaded ---
    if (operation === 'update' && !req.file) {
      const id = (args as { id?: string | number }).id
      if (!id) return

      const existingDoc = await req.payload.findByID({
        collection: collectionSlug,
        id,
        req,
        depth: 0,
      })

      // Check if any conversion or resize is needed
      const currentMime = existingDoc.mimeType as string | undefined
      const targetMime = FORMAT_MIME_MAP[targetFormat]
      const needsFormatChange = currentMime && currentMime !== targetMime
      const needsResize = resizeWidth || resizeHeight
      if (!currentMime || (!needsFormatChange && !needsResize)) return

      // Max file size check before fetching (avoid wasted bandwidth)
      if (config.maxFileSize && existingDoc.filesize && (existingDoc.filesize as number) > config.maxFileSize) {
        req.payload.logger.warn(
          `payload-img-convert: Existing file size (${existingDoc.filesize} bytes) exceeds maxFileSize (${config.maxFileSize} bytes). Skipping re-conversion.`,
        )
        return
      }

      // Fetch the existing file from storage
      const fileUrl = existingDoc.url as string | undefined
      if (!fileUrl) return

      // Determine the actual output format — use current format if only resizing
      const outputFormat = needsFormatChange ? targetFormat : MIME_FORMAT_MAP[currentMime]
      if (!outputFormat) return
      const outputMime = FORMAT_MIME_MAP[outputFormat]

      if (needsFormatChange) {
        req.payload.logger.info(
          `payload-img-convert: Re-converting existing image (${currentMime} → ${targetMime})`,
        )
      }
      if (needsResize) {
        req.payload.logger.info(
          `payload-img-convert: Resizing existing image (maxWidth: ${resizeWidth ?? 'none'}, maxHeight: ${resizeHeight ?? 'none'})`,
        )
      }

      // Warn about quality degradation for lossy-to-lossy re-conversion
      const lossyMimes = ['image/jpeg', 'image/webp', 'image/avif']
      if (needsFormatChange && lossyMimes.includes(currentMime) && lossyMimes.includes(targetMime)) {
        req.payload.logger.warn(
          'payload-img-convert: Re-converting between lossy formats will degrade quality. ' +
            'For best results, upload the original file.',
        )
      }

      try {
        const response = await fetch(fileUrl)
        if (!response.ok) {
          req.payload.logger.warn(
            `payload-img-convert: Failed to fetch existing file from ${fileUrl} (${response.status}). Skipping re-conversion.`,
          )
          return
        }
        const buffer = Buffer.from(await response.arrayBuffer())

        const originalSize = buffer.length
        const { data: convertedBuffer, info } = await convertImage(
          sharp, buffer, outputFormat, outputOptions, resizeWidth, resizeHeight,
        )

        // Only set originalFilesize after successful conversion
        data.originalFilesize = originalSize

        // Set req.file — Payload will process this as a new upload
        req.file = {
          data: convertedBuffer,
          mimetype: outputMime,
          name: replaceExtension(existingDoc.filename as string, FORMAT_EXTENSION_MAP[outputFormat]),
          size: info.size,
        }
      } catch (err) {
        req.payload.logger.warn(
          `payload-img-convert: Failed to process image (format: ${outputFormat}). Keeping original. Error: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
      return
    }

    // --- New upload conversion ---
    if (!req.file) return
    if (!req.file.mimetype || !isConvertibleImage(req.file.mimetype)) return

    // Skip if already in target format AND no resize needed
    const targetMime = FORMAT_MIME_MAP[targetFormat]
    const needsFormatChange = req.file.mimetype !== targetMime
    const needsResize = resizeWidth || resizeHeight
    if (!needsFormatChange && !needsResize) return

    // Use current format if only resizing (avoid unnecessary re-encoding)
    const outputFormat = needsFormatChange ? targetFormat : MIME_FORMAT_MAP[req.file.mimetype]
    if (!outputFormat) return
    const outputMime = FORMAT_MIME_MAP[outputFormat]

    try {
      const originalSize = req.file.size
      const { data: convertedBuffer, info } = await convertImage(
        sharp, req.file.data, outputFormat, outputOptions, resizeWidth, resizeHeight,
      )

      // Only set originalFilesize after successful conversion
      data.originalFilesize = originalSize

      // Mutate req.file in place — req is passed by reference
      req.file.data = convertedBuffer
      req.file.mimetype = outputMime
      req.file.name = replaceExtension(req.file.name, FORMAT_EXTENSION_MAP[outputFormat])
      req.file.size = info.size
    } catch (err) {
      // Graceful failure: log warning, leave original file unchanged
      req.payload.logger.warn(
        `payload-img-convert: Failed to process image (format: ${outputFormat}). Keeping original. Error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
}
