import type { NumberField } from 'payload'
import type { ImageConverterConfig } from '../types.js'
import { RESIZE_MAX_WIDTH_FIELD_NAME, RESIZE_MAX_HEIGHT_FIELD_NAME } from '../defaults.js'

export function createResizeSelectorFields(pluginConfig: ImageConverterConfig): NumberField[] {
  const clientProps = {
    defaultMaxWidth: pluginConfig.maxWidth,
    defaultMaxHeight: pluginConfig.maxHeight,
    oversizeThreshold: pluginConfig.oversizeThreshold ?? 2500,
  }

  return [
    {
      name: RESIZE_MAX_WIDTH_FIELD_NAME,
      type: 'number',
      label: ' ',
      defaultValue: pluginConfig.maxWidth,
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
      defaultValue: pluginConfig.maxHeight,
      admin: {
        position: 'sidebar',
        hidden: true,
      },
    },
  ]
}
