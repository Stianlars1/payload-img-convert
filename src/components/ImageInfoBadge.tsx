'use client'

import { useState, useEffect, useCallback } from 'react'
import { useField } from '@payloadcms/ui'

const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'image/tiff': 'TIFF',
  'image/bmp': 'BMP',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFormatLabel(mimeType: string): string {
  return MIME_LABELS[mimeType] ?? mimeType.replace('image/', '').toUpperCase()
}

interface ImageInfo {
  width: number
  height: number
  fileSize: number
  mimeType: string
}

export const ImageInfoBadgeComponent: React.FC = () => {
  const { value: savedWidth, setValue: setWidth } = useField<number | undefined>({ path: 'width' })
  const { value: savedHeight, setValue: setHeight } = useField<number | undefined>({ path: 'height' })
  const { value: savedFilesize } = useField<number | undefined>({ path: 'filesize' })
  const { value: savedMimeType } = useField<string | undefined>({ path: 'mimeType' })
  const { value: filename } = useField<string | undefined>({ path: 'filename' })

  const [uploadInfo, setUploadInfo] = useState<ImageInfo | null>(null)

  const readFileFromInput = useCallback(() => {
    const fileInput = document.querySelector<HTMLInputElement>('.file-field__upload input[type="file"]')
    if (!fileInput?.files?.length) return
    const file = fileInput.files[0]

    if (!file.type.startsWith('image/')) {
      setUploadInfo(null)
      return
    }

    const blobUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setUploadInfo({
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileSize: file.size,
        mimeType: file.type,
      })
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
      URL.revokeObjectURL(blobUrl)
    }
    img.onerror = () => {
      setUploadInfo(null)
      URL.revokeObjectURL(blobUrl)
    }
    img.src = blobUrl
  }, [setWidth, setHeight])

  // Watch for file input changes via MutationObserver
  useEffect(() => {
    const attachListener = (input: HTMLInputElement) => {
      input.addEventListener('change', readFileFromInput)
      return () => input.removeEventListener('change', readFileFromInput)
    }

    // Try to find existing input
    const existing = document.querySelector<HTMLInputElement>('.file-field__upload input[type="file"]')
    let cleanup: (() => void) | undefined
    if (existing) {
      cleanup = attachListener(existing)
    }

    // Observe DOM for dynamically added file inputs
    const observer = new MutationObserver(() => {
      const input = document.querySelector<HTMLInputElement>('.file-field__upload input[type="file"]')
      if (input) {
        cleanup?.()
        cleanup = attachListener(input)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cleanup?.()
      observer.disconnect()
    }
  }, [readFileFromInput])

  // Also try reading file when filename changes (signals new upload)
  useEffect(() => {
    if (filename) readFileFromInput()
  }, [filename, readFileFromInput])

  // Determine which data to display
  const info: ImageInfo | null = uploadInfo ?? (
    savedWidth && savedHeight && savedFilesize && savedMimeType
      ? { width: savedWidth, height: savedHeight, fileSize: savedFilesize, mimeType: savedMimeType }
      : null
  )

  if (!info) return null

  return (
    <div
      style={{
        padding: '8px 12px',
        marginBottom: '16px',
        borderRadius: '4px',
        backgroundColor: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        fontSize: '13px',
        color: 'var(--theme-elevation-800)',
        fontFamily: 'inherit',
        lineHeight: '1.4',
      }}
    >
      {info.width} &times; {info.height} px
      {' \u2022 '}
      {formatFileSize(info.fileSize)}
      {' \u2022 '}
      {getFormatLabel(info.mimeType)}
    </div>
  )
}
