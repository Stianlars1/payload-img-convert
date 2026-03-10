import type { NumberField } from 'payload'
import type { ResolvedConfig } from '../types.js'
import { RESIZE_MAX_WIDTH_FIELD_NAME, RESIZE_MAX_HEIGHT_FIELD_NAME } from '../defaults.js'

export function createResizeSelectorFields(config: ResolvedConfig): NumberField[] {
  const clientProps = {
    defaultMaxWidth: config.maxWidth,
    defaultMaxHeight: config.maxHeight,
    oversizeThreshold: config.oversizeThreshold,
    heightFieldPath: RESIZE_MAX_HEIGHT_FIELD_NAME,
  }

  return [
    {
      name: RESIZE_MAX_WIDTH_FIELD_NAME,
      type: 'number',
      label: ' ',
      defaultValue: config.maxWidth,
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: 'payload-img-convert/client#ResizeSelectorComponent',
            clientProps,
          },
        },
      },
    },
    {
      name: RESIZE_MAX_HEIGHT_FIELD_NAME,
      type: 'number',
      label: ' ',
      defaultValue: config.maxHeight,
      admin: {
        position: 'sidebar',
        hidden: true,
      },
    },
  ]
}
