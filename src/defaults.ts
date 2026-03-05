import type { ImageFormat, ImageConverterConfig } from './types.js'

export const FORMAT_SELECTOR_FIELD_NAME = 'convertFormat'

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

export const DEFAULT_CONFIG: Required<Omit<ImageConverterConfig, 'collections' | 'formatOptions' | 'maxWidth' | 'maxHeight' | 'maxFileSize'>> &
  Pick<ImageConverterConfig, 'formatOptions' | 'maxWidth' | 'maxHeight' | 'maxFileSize'> = {
  defaultFormat: 'webp',
  quality: 80,
  enableFormatSelector: true,
  formats: ALL_FORMATS,
  disabled: false,
  formatOptions: undefined,
}
