export type ImageFormat = 'webp' | 'avif' | 'png' | 'jpeg'

export interface FormatOptions {
  webp?: {
    quality?: number
    lossless?: boolean
    nearLossless?: boolean
    effort?: number
  }
  avif?: {
    quality?: number
    lossless?: boolean
    effort?: number
  }
  png?: {
    compressionLevel?: number
    palette?: boolean
    quality?: number
    effort?: number
  }
  jpeg?: {
    quality?: number
    progressive?: boolean
    mozjpeg?: boolean
  }
}

export interface ImageConverterConfig {
  /** Upload collections to target */
  collections: string[]
  /** Default conversion format. Default: 'webp' */
  defaultFormat?: ImageFormat
  /** Default quality (0-100). Default: 80 */
  quality?: number
  /** Per-format Sharp options */
  formatOptions?: FormatOptions
  /** Add a format selector dropdown in the upload sidebar. Default: true */
  enableFormatSelector?: boolean
  /** Formats available in the dropdown. Default: all four */
  formats?: ImageFormat[]
  /** Kill switch — disables conversion but keeps the field for schema consistency. Default: false */
  disabled?: boolean
  /** Max width in pixels. Aspect ratio is preserved. */
  maxWidth?: number
  /** Max height in pixels. Aspect ratio is preserved. */
  maxHeight?: number
  /** Max file size in bytes. Files exceeding this are skipped (not converted). */
  maxFileSize?: number
}
