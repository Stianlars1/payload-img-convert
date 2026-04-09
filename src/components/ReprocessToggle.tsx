'use client'

import { CheckboxInput } from '@payloadcms/ui'
import { usePluginProcessingState } from './usePluginProcessingState.js'

interface ReprocessToggleProps {
  field: {
    name: string
    label?: string
  }
}

export const ReprocessToggleComponent: React.FC<ReprocessToggleProps> = ({ field }) => {
  const {
    hasSelectedUpload,
    hasStoredImage,
    isProcessed,
    reprocessDisabled,
    reprocessEnabled,
    setReprocessEnabled,
  } = usePluginProcessingState()

  if (!hasStoredImage || hasSelectedUpload || !isProcessed) return null

  return (
    <div style={{ marginBottom: '16px' }}>
      {isProcessed && (
        <div
          style={{
            padding: '8px 10px',
            marginBottom: '10px',
            borderRadius: '4px',
            backgroundColor: 'var(--theme-warning-100, #fef3cd)',
            border: '1px solid var(--theme-warning-200, #ffc107)',
            fontSize: '12px',
            color: 'var(--theme-warning-900, #664d03)',
            lineHeight: 1.5,
          }}
        >
          This image has already been processed. Reprocessing is off by default to avoid
          accidental quality loss. Enable it below only if you want to apply new format or
          resize settings.
        </div>
      )}

      <CheckboxInput
        checked={reprocessEnabled}
        label={field.label ?? 'Enable Reprocessing'}
        name={field.name}
        onToggle={(event) => setReprocessEnabled(event.target.checked)}
        readOnly={reprocessDisabled}
      />

      <p
        style={{
          margin: '6px 0 0 0',
          fontSize: '12px',
          color: 'var(--theme-elevation-500)',
          lineHeight: 1.5,
        }}
      >
        Turn this on, adjust format or resize settings below, then save once to reprocess the
        stored image.
      </p>
    </div>
  )
}
