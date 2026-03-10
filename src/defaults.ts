import type { ImageFormat, ImageConverterConfig } from './types.js'

export const FORMAT_SELECTOR_FIELD_NAME = 'convertFormat'
export const RESIZE_MAX_WIDTH_FIELD_NAME = 'resizeMaxWidth'
export const RESIZE_MAX_HEIGHT_FIELD_NAME = 'resizeMaxHeight'

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  webp: 'WebP',
  avif: 'AVIF',
  png: 'PNG',
  jpeg: 'JPEG',
}

export const FORMAT_MIME_MAP: Record<ImageFormat, string> = {
  webp: 'image/webp',
  avif: 'image/avif',
  png: 'image/png',
  jpeg: 'image/jpeg',
}

export const FORMAT_EXTENSION_MAP: Record<ImageFormat, string> = {
  webp: '.webp',
  avif: '.avif',
  png: '.png',
  jpeg: '.jpg',
}

export const ALL_FORMATS: ImageFormat[] = ['webp', 'avif', 'png', 'jpeg']

export const MIME_FORMAT_MAP: Record<string, ImageFormat> = Object.fromEntries(
  Object.entries(FORMAT_MIME_MAP).map(([format, mime]) => [mime, format as ImageFormat]),
) as Record<string, ImageFormat>

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const DEFAULT_CONFIG: Required<Omit<ImageConverterConfig, 'collections' | 'formatOptions' | 'maxWidth' | 'maxHeight' | 'maxFileSize'>> &
  Pick<ImageConverterConfig, 'formatOptions' | 'maxWidth' | 'maxHeight' | 'maxFileSize'> = {
  defaultFormat: 'webp',
  quality: 80,
  enableFormatSelector: true,
  enableResizeSelector: true,
  formats: ALL_FORMATS,
  disabled: false,
  formatOptions: undefined,
  oversizeThreshold: 2500,
}
