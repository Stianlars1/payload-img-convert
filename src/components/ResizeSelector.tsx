'use client'

import { useState, useEffect } from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'

interface ResizeSelectorProps {
  field: {
    name: string
    label?: string
  }
  path: string
  heightFieldPath?: string
  defaultMaxWidth?: number
  defaultMaxHeight?: number
  oversizeThreshold?: number
}

export const ResizeSelectorComponent: React.FC<ResizeSelectorProps> = ({
  path,
  heightFieldPath,
  defaultMaxWidth,
  defaultMaxHeight,
  oversizeThreshold = 2500,
}) => {
  const { value: widthValue, setValue: setWidthValue } = useField<number | undefined>({ path })
  const heightPath = heightFieldPath || path.replace('resizeMaxWidth', 'resizeMaxHeight')
  const { value: heightValue, setValue: setHeightValue } = useField<number | undefined>({
    path: heightPath,
  })

  // Read actual image dimensions from sibling fields
  const { value: imageWidth } = useField<number | undefined>({ path: 'width' })
  const { value: imageHeight } = useField<number | undefined>({ path: 'height' })

  const hasValues = !!(widthValue || heightValue)
  const [isOpen, setIsOpen] = useState(hasValues)

  // Auto-expand when values are present
  useEffect(() => {
    if (hasValues && !isOpen) setIsOpen(true)
  }, [hasValues])

  // Detect oversized images
  const isOversized =
    oversizeThreshold > 0 &&
    ((imageWidth && imageWidth > oversizeThreshold) ||
      (imageHeight && imageHeight > oversizeThreshold))

  // Auto-fill suggested width when oversized and fields are empty
  const handleAutoFill = () => {
    if (!widthValue && !heightValue) {
      setWidthValue(oversizeThreshold)
    }
    if (!isOpen) setIsOpen(true)
  }

  const displayWidth = widthValue ?? defaultMaxWidth ?? ''
  const displayHeight = heightValue ?? defaultMaxHeight ?? ''

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: '4px',
    backgroundColor: 'var(--theme-input-bg)',
    color: 'var(--theme-text)',
    fontSize: '14px',
    lineHeight: '20px',
  }

  return (
    <div style={{ marginBottom: '16px' }}>
        {/* Oversize warning */}
        {isOversized && (
            <div
                style={{
                    padding: '8px 10px',
                    marginBottom: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--theme-warning-100, #fef3cd)',
                    border: '1px solid var(--theme-warning-200, #ffc107)',
                    fontSize: '12px',
                    color: 'var(--theme-warning-900, #664d03)',
                }}
            >
                Image is {imageWidth}&times;{imageHeight}px — consider resizing for better web
                performance.
                {!widthValue && !heightValue && (
                    <>
                        {' '}
                        <button
                            type="button"
                            onClick={handleAutoFill}
                            style={{
                                border: 'none',
                                background: 'none',
                                color: 'inherit',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                            }}
                        >
                            Auto-fill max width ({oversizeThreshold}px)
                        </button>
                    </>
                )}
            </div>
        )}

      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          padding: '8px 0',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--theme-text)',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: '12px',
          }}
        >
          ▶
        </span>
        Resize Options
        {hasValues && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--theme-elevation-500)',
              fontWeight: 400,
            }}
          >
            (active)
          </span>
        )}
      </button>


      {/* Collapsible content */}
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <FieldLabel label="Max Width (px)" path={path} />
            <input
              type="number"
              value={displayWidth}
              min={1}
              step={1}
              placeholder="No width limit"
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  setWidthValue(undefined)
                } else {
                  const num = parseInt(raw, 10)
                  if (!Number.isNaN(num) && num > 0) setWidthValue(num)
                }
              }}
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel label="Max Height (px)" path={heightPath} />
            <input
              type="number"
              value={displayHeight}
              min={1}
              step={1}
              placeholder="No height limit"
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  setHeightValue(undefined)
                } else {
                  const num = parseInt(raw, 10)
                  if (!Number.isNaN(num) && num > 0) setHeightValue(num)
                }
              }}
              style={inputStyle}
            />
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--theme-elevation-500)',
              margin: '0',
            }}
          >
            Aspect ratio preserved, no upscaling.
          </p>
        </div>
      )}
    </div>
  )
}
