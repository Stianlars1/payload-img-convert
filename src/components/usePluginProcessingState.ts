'use client'

import { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import {
  IMG_CONVERT_PROCESSED_FIELD_NAME,
  IMG_CONVERT_REPROCESS_FIELD_NAME,
} from '../defaults.js'

function useHasSelectedUpload(): boolean {
  const [hasSelectedUpload, setHasSelectedUpload] = useState(false)

  useEffect(() => {
    const readInputState = (input?: HTMLInputElement | null) => {
      setHasSelectedUpload(!!input?.files?.length)
    }

    const attachListener = (input: HTMLInputElement) => {
      const handleChange = () => readInputState(input)

      readInputState(input)
      input.addEventListener('change', handleChange)

      return () => input.removeEventListener('change', handleChange)
    }

    const getInput = () => document.querySelector<HTMLInputElement>('.file-field__upload input[type="file"]')

    let cleanup: (() => void) | undefined
    let activeInput: HTMLInputElement | null = null
    const existingInput = getInput()
    if (existingInput) {
      activeInput = existingInput
      cleanup = attachListener(existingInput)
    } else {
      setHasSelectedUpload(false)
    }

    const observer = new MutationObserver(() => {
      const input = getInput()
      if (!input) {
        cleanup?.()
        cleanup = undefined
        activeInput = null
        setHasSelectedUpload(false)
        return
      }

      if (input === activeInput && cleanup) return

      cleanup?.()
      activeInput = input
      cleanup = attachListener(input)
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cleanup?.()
      observer.disconnect()
    }
  }, [])

  return hasSelectedUpload
}

export function usePluginProcessingState() {
  const { value: processedValue } = useField<boolean | undefined>({
    path: IMG_CONVERT_PROCESSED_FIELD_NAME,
  })
  const {
    value: reprocessValue,
    setValue: setReprocessValue,
    disabled: reprocessDisabled,
  } = useField<boolean | undefined>({
    path: IMG_CONVERT_REPROCESS_FIELD_NAME,
  })
  const { value: originalFilesize } = useField<number | undefined>({ path: 'originalFilesize' })
  const { value: filename } = useField<string | undefined>({ path: 'filename' })

  const hasSelectedUpload = useHasSelectedUpload()
  const hasStoredImage = !!filename
  const isProcessed =
    processedValue === true ||
    (processedValue == null && typeof originalFilesize === 'number')

  const isLocked = hasStoredImage && isProcessed && !hasSelectedUpload && !reprocessValue

  return {
    hasSelectedUpload,
    hasStoredImage,
    isLocked,
    isProcessed,
    reprocessDisabled,
    reprocessEnabled: reprocessValue === true,
    setReprocessEnabled: (value: boolean) => setReprocessValue(value),
  }
}
