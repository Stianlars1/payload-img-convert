'use client'

import { SelectInput, useField } from '@payloadcms/ui'
import type { ImageFormat } from '../types.js'
import { FORMAT_LABELS, FORMAT_MIME_MAP } from '../defaults.js'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

interface FormatSelectorProps {
  field: {
    name: string
    label?: string
  }
  path: string
  formats: ImageFormat[]
  defaultFormat: ImageFormat
}

export const FormatSelectorComponent: React.FC<FormatSelectorProps> = ({
  field,
  path,
  formats,
  defaultFormat,
}) => {
  const { value, setValue } = useField<string>({ path })

  const { value: filesize } = useField<number>({ path: 'filesize' })
  const { value: originalFilesize } = useField<number>({ path: 'originalFilesize' })
  const { value: mimeType } = useField<string>({ path: 'mimeType' })

  const options = formats.map((format) => ({
    label: FORMAT_LABELS[format],
    value: format,
  }))

  // Determine if savings should be shown
  const showSavings = originalFilesize && filesize && originalFilesize > filesize
  const savingsPercent = showSavings
    ? Math.round((1 - filesize / originalFilesize) * 100)
    : null

  // Determine if quality warning should be shown:
  // existing image (mimeType set) AND selected format differs from current
  const selectedFormat = (value ?? defaultFormat) as ImageFormat
  const selectedMime = FORMAT_MIME_MAP[selectedFormat]
  const showQualityWarning = mimeType && selectedMime !== mimeType

  return (
    <div>
      <SelectInput
        path={path}
        name={field.name}
        label={field.label ?? 'Convert to Format'}
        value={value ?? defaultFormat}
        onChange={(option) => {
          if (option && typeof option === 'object' && 'value' in option) {
            setValue(option.value as string)
          }
        }}
        options={options}
      />
      {showSavings && (
        <p style={{ fontSize: '13px', color: 'var(--theme-success-500)', margin: '4px 0 0 0' }}>
          Saved {savingsPercent}% ({formatBytes(originalFilesize)} → {formatBytes(filesize)})
        </p>
      )}
      {showQualityWarning && (
        <p style={{ fontSize: '13px', color: 'var(--theme-warning-500)', margin: '4px 0 0 0' }}>
          ⚠ Re-converting may reduce quality. For best results, upload the original file.
        </p>
      )}
    </div>
  )
}
