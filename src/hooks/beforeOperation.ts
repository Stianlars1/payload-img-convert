import type { CollectionBeforeOperationHook } from 'payload'
import type { ImageConverterConfig, ImageFormat } from '../types.js'
import {
  FORMAT_EXTENSION_MAP,
  FORMAT_MIME_MAP,
  FORMAT_SELECTOR_FIELD_NAME,
  DEFAULT_CONFIG,
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

export function createBeforeOperationHook(
  pluginConfig: ImageConverterConfig,
  collectionSlug: string,
): CollectionBeforeOperationHook {
  const config = { ...DEFAULT_CONFIG, ...pluginConfig }

  return async ({ operation, req, args }) => {
    if (operation !== 'create' && operation !== 'update') return

    // Determine target format: UI selection takes priority, then default
    const data = args?.data ?? (args as Record<string, unknown>)
    const selectedFormat = data?.[FORMAT_SELECTOR_FIELD_NAME] as ImageFormat | undefined
    const targetFormat: ImageFormat = selectedFormat || config.defaultFormat

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

      // Check if the existing file is already in the target format
      const currentMime = existingDoc.mimeType as string | undefined
      const targetMime = FORMAT_MIME_MAP[targetFormat]
      if (!currentMime || currentMime === targetMime) return

      // Fetch the existing file from storage
      const fileUrl = existingDoc.url as string | undefined
      if (!fileUrl) return

      req.payload.logger.info(
        `payload-img-convert: Re-converting existing image (${currentMime} → ${targetMime})`,
      )

      // Warn about quality degradation for lossy-to-lossy re-conversion
      const lossyMimes = ['image/jpeg', 'image/webp', 'image/avif']
      if (lossyMimes.includes(currentMime) && lossyMimes.includes(targetMime)) {
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

        // Max file size check for re-conversion
        if (config.maxFileSize && buffer.length > config.maxFileSize) {
          req.payload.logger.warn(
            `payload-img-convert: Existing file size (${buffer.length} bytes) exceeds maxFileSize (${config.maxFileSize} bytes). Skipping re-conversion.`,
          )
          return
        }

        // Record the original file size before conversion
        const originalSize = buffer.length
        data.originalFilesize = originalSize

        let pipeline = sharp(buffer)

        if (config.maxWidth || config.maxHeight) {
          pipeline = pipeline.resize({
            width: config.maxWidth,
            height: config.maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
          })
        }

        const { data: convertedBuffer, info } = await pipeline
          .toFormat(targetFormat, outputOptions)
          .toBuffer({ resolveWithObject: true })

        // Set req.file — Payload will process this as a new upload
        req.file = {
          data: convertedBuffer,
          mimetype: FORMAT_MIME_MAP[targetFormat],
          name: replaceExtension(existingDoc.filename as string, FORMAT_EXTENSION_MAP[targetFormat]),
          size: info.size,
        }
      } catch (err) {
        req.payload.logger.warn(
          `payload-img-convert: Failed to re-convert to ${targetFormat}. Keeping original. Error: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
      return
    }

    // --- New upload conversion ---
    if (!req.file) return
    if (!req.file.mimetype || !isConvertibleImage(req.file.mimetype)) return

    // Skip if already in target format
    const targetMime = FORMAT_MIME_MAP[targetFormat]
    if (req.file.mimetype === targetMime) return

    try {
      // Record the original file size before conversion
      const originalSize = req.file.size
      data.originalFilesize = originalSize

      let pipeline = sharp(req.file.data)

      if (config.maxWidth || config.maxHeight) {
        pipeline = pipeline.resize({
          width: config.maxWidth,
          height: config.maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
      }

      const { data: convertedBuffer, info } = await pipeline
        .toFormat(targetFormat, outputOptions)
        .toBuffer({ resolveWithObject: true })

      // Mutate req.file in place — req is passed by reference
      req.file.data = convertedBuffer
      req.file.mimetype = FORMAT_MIME_MAP[targetFormat]
      req.file.name = replaceExtension(req.file.name, FORMAT_EXTENSION_MAP[targetFormat])
      req.file.size = info.size
    } catch (err) {
      // Graceful failure: log warning, leave original file unchanged
      req.payload.logger.warn(
        `payload-img-convert: Failed to convert to ${targetFormat}. Keeping original. Error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
}
