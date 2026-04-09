import type { CollectionBeforeOperationHook } from 'payload'
import type { ImageFormat, ResolvedConfig } from '../types.js'
import {
  FORMAT_EXTENSION_MAP,
  FORMAT_MIME_MAP,
  MIME_FORMAT_MAP,
  FORMAT_SELECTOR_FIELD_NAME,
  IMG_CONVERT_PROCESSED_FIELD_NAME,
  IMG_CONVERT_REPROCESS_FIELD_NAME,
  RESIZE_MAX_WIDTH_FIELD_NAME,
  RESIZE_MAX_HEIGHT_FIELD_NAME,
} from '../defaults.js'

const SKIP_MIMES = ['image/svg+xml', 'image/gif']
const IMAGE_FORMATS: ImageFormat[] = ['webp', 'avif', 'png', 'jpeg']

type DocLike = Record<string, unknown>

function isConvertibleImage(mimeType: string): boolean {
  return mimeType.startsWith('image/') && !SKIP_MIMES.includes(mimeType)
}

function isImageFormat(value: unknown): value is ImageFormat {
  return typeof value === 'string' && IMAGE_FORMATS.includes(value as ImageFormat)
}

function hasOwnProperty(doc: DocLike, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(doc, key)
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return undefined
}

function getPersistedFormat(
  doc: DocLike,
  fallbackMime?: string,
  fallbackFormat?: ImageFormat,
): ImageFormat {
  const storedFormat = doc[FORMAT_SELECTOR_FIELD_NAME]
  if (isImageFormat(storedFormat)) {
    return storedFormat
  }

  if (fallbackMime) {
    const inferredFormat = MIME_FORMAT_MAP[fallbackMime]
    if (inferredFormat) {
      return inferredFormat
    }
  }

  return fallbackFormat ?? 'webp'
}

function getPersistedResizeValue(doc: DocLike, fieldName: string): number | undefined {
  return normalizeOptionalNumber(doc[fieldName])
}

function isProcessedDocument(doc: DocLike): boolean {
  return doc[IMG_CONVERT_PROCESSED_FIELD_NAME] === true || normalizeOptionalNumber(doc.originalFilesize) !== undefined
}

function persistAppliedSettings(
  data: DocLike,
  format: ImageFormat,
  resizeWidth?: number,
  resizeHeight?: number,
): void {
  data[FORMAT_SELECTOR_FIELD_NAME] = format

  if (resizeWidth !== undefined || hasOwnProperty(data, RESIZE_MAX_WIDTH_FIELD_NAME)) {
    data[RESIZE_MAX_WIDTH_FIELD_NAME] = resizeWidth
  }

  if (resizeHeight !== undefined || hasOwnProperty(data, RESIZE_MAX_HEIGHT_FIELD_NAME)) {
    data[RESIZE_MAX_HEIGHT_FIELD_NAME] = resizeHeight
  }

  data[IMG_CONVERT_PROCESSED_FIELD_NAME] = true
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

    const data = args?.data as DocLike | undefined
    if (!data) return

    const requestedReprocess = data[IMG_CONVERT_REPROCESS_FIELD_NAME] === true
    if (operation === 'update') {
      data[IMG_CONVERT_REPROCESS_FIELD_NAME] = false
    }

    if (operation === 'create' || req.file) {
      data[IMG_CONVERT_PROCESSED_FIELD_NAME] = false
      data.originalFilesize = null
    }

    const sharp = req.payload.config?.sharp
    if (!sharp) {
      req.payload.logger.warn(
        'payload-img-convert: Sharp is not available on req.payload.config.sharp. Skipping conversion.',
      )
      return
    }

    if (config.maxFileSize && req.file && req.file.size > config.maxFileSize) {
      req.payload.logger.warn(
        `payload-img-convert: File size (${req.file.size} bytes) exceeds maxFileSize (${config.maxFileSize} bytes). Skipping conversion.`,
      )
      return
    }

    if (operation === 'update' && !req.file) {
      const id = (args as { id?: string | number }).id
      if (!id) return

      const existingDoc = await req.payload.findByID({
        collection: collectionSlug,
        id,
        req,
        depth: 0,
      }) as DocLike

      const existingProcessed = isProcessedDocument(existingDoc)
      data[IMG_CONVERT_PROCESSED_FIELD_NAME] = existingProcessed

      if (existingProcessed && !requestedReprocess) return

      const currentMime = typeof existingDoc.mimeType === 'string' ? existingDoc.mimeType : undefined
      const existingFormat = getPersistedFormat(existingDoc, currentMime, config.defaultFormat)
      const targetFormat = hasOwnProperty(data, FORMAT_SELECTOR_FIELD_NAME)
        ? getPersistedFormat(data, undefined, existingFormat)
        : existingFormat

      const existingResizeWidth = getPersistedResizeValue(existingDoc, RESIZE_MAX_WIDTH_FIELD_NAME)
      const existingResizeHeight = getPersistedResizeValue(existingDoc, RESIZE_MAX_HEIGHT_FIELD_NAME)
      const resizeWidth = hasOwnProperty(data, RESIZE_MAX_WIDTH_FIELD_NAME)
        ? getPersistedResizeValue(data, RESIZE_MAX_WIDTH_FIELD_NAME)
        : existingResizeWidth
      const resizeHeight = hasOwnProperty(data, RESIZE_MAX_HEIGHT_FIELD_NAME)
        ? getPersistedResizeValue(data, RESIZE_MAX_HEIGHT_FIELD_NAME)
        : existingResizeHeight

      const settingsChanged =
        targetFormat !== existingFormat ||
        resizeWidth !== existingResizeWidth ||
        resizeHeight !== existingResizeHeight

      if (!settingsChanged) {
        req.payload.logger.info(
          'payload-img-convert: Reprocess requested but no format or resize changes were detected. Skipping.',
        )
        return
      }

      const targetMime = FORMAT_MIME_MAP[targetFormat]
      const needsFormatChange = !!currentMime && currentMime !== targetMime
      const needsResizeChange =
        resizeWidth !== existingResizeWidth ||
        resizeHeight !== existingResizeHeight

      if (!currentMime || (!needsFormatChange && !needsResizeChange)) return

      const existingFilesize = normalizeOptionalNumber(existingDoc.filesize)
      if (config.maxFileSize && existingFilesize && existingFilesize > config.maxFileSize) {
        req.payload.logger.warn(
          `payload-img-convert: Existing file size (${existingFilesize} bytes) exceeds maxFileSize (${config.maxFileSize} bytes). Skipping re-conversion.`,
        )
        return
      }

      const fileUrl = typeof existingDoc.url === 'string' ? existingDoc.url : undefined
      const existingFilename = typeof existingDoc.filename === 'string' ? existingDoc.filename : undefined
      if (!fileUrl || !existingFilename) return

      const outputFormat = needsFormatChange ? targetFormat : MIME_FORMAT_MAP[currentMime]
      if (!outputFormat) return
      const outputMime = FORMAT_MIME_MAP[outputFormat]

      const formatSpecificOptions = config.formatOptions?.[targetFormat] ?? {}
      const outputOptions = {
        quality: config.quality,
        ...formatSpecificOptions,
      }

      if (needsFormatChange) {
        req.payload.logger.info(
          `payload-img-convert: Re-converting existing image (${currentMime} → ${targetMime})`,
        )
      }

      if (needsResizeChange) {
        req.payload.logger.info(
          `payload-img-convert: Re-processing existing image with resize settings (maxWidth: ${resizeWidth ?? 'none'}, maxHeight: ${resizeHeight ?? 'none'})`,
        )
      }

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
          sharp,
          buffer,
          outputFormat,
          outputOptions,
          resizeWidth,
          resizeHeight,
        )

        data.originalFilesize = originalSize
        persistAppliedSettings(data, targetFormat, resizeWidth, resizeHeight)

        req.file = {
          data: convertedBuffer,
          mimetype: outputMime,
          name: replaceExtension(existingFilename, FORMAT_EXTENSION_MAP[outputFormat]),
          size: info.size,
        }
      } catch (err) {
        req.payload.logger.warn(
          `payload-img-convert: Failed to process image (format: ${outputFormat}). Keeping original. Error: ${err instanceof Error ? err.message : String(err)}`,
        )
      }

      return
    }

    if (!req.file) return
    if (!req.file.mimetype || !isConvertibleImage(req.file.mimetype)) return

    const targetFormat = hasOwnProperty(data, FORMAT_SELECTOR_FIELD_NAME)
      ? getPersistedFormat(data, undefined, config.defaultFormat)
      : config.defaultFormat
    const resizeWidth = hasOwnProperty(data, RESIZE_MAX_WIDTH_FIELD_NAME)
      ? getPersistedResizeValue(data, RESIZE_MAX_WIDTH_FIELD_NAME)
      : config.maxWidth
    const resizeHeight = hasOwnProperty(data, RESIZE_MAX_HEIGHT_FIELD_NAME)
      ? getPersistedResizeValue(data, RESIZE_MAX_HEIGHT_FIELD_NAME)
      : config.maxHeight

    const targetMime = FORMAT_MIME_MAP[targetFormat]
    const needsFormatChange = req.file.mimetype !== targetMime
    const needsResize = !!(resizeWidth || resizeHeight)
    if (!needsFormatChange && !needsResize) return

    const outputFormat = needsFormatChange ? targetFormat : MIME_FORMAT_MAP[req.file.mimetype]
    if (!outputFormat) return
    const outputMime = FORMAT_MIME_MAP[outputFormat]

    const formatSpecificOptions = config.formatOptions?.[targetFormat] ?? {}
    const outputOptions = {
      quality: config.quality,
      ...formatSpecificOptions,
    }

    try {
      const originalSize = req.file.size
      const { data: convertedBuffer, info } = await convertImage(
        sharp,
        req.file.data,
        outputFormat,
        outputOptions,
        resizeWidth,
        resizeHeight,
      )

      data.originalFilesize = originalSize
      persistAppliedSettings(data, targetFormat, resizeWidth, resizeHeight)

      req.file.data = convertedBuffer
      req.file.mimetype = outputMime
      req.file.name = replaceExtension(req.file.name, FORMAT_EXTENSION_MAP[outputFormat])
      req.file.size = info.size
    } catch (err) {
      req.payload.logger.warn(
        `payload-img-convert: Failed to process image (format: ${outputFormat}). Keeping original. Error: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
}
