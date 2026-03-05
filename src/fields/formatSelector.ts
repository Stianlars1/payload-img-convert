import type { SelectField } from 'payload'
import type { ImageConverterConfig } from '../types.js'
import { ALL_FORMATS, DEFAULT_CONFIG, FORMAT_LABELS, FORMAT_SELECTOR_FIELD_NAME } from '../defaults.js'

export function createFormatSelectorField(pluginConfig: ImageConverterConfig): SelectField {
  const formats = pluginConfig.formats ?? ALL_FORMATS
  const defaultFormat = pluginConfig.defaultFormat ?? DEFAULT_CONFIG.defaultFormat

  return {
    name: FORMAT_SELECTOR_FIELD_NAME,
    type: 'select',
    label: 'Convert to Format',
    defaultValue: defaultFormat,
    options: formats.map((format) => ({
      label: FORMAT_LABELS[format],
      value: format,
    })),
    admin: {
      position: 'sidebar',
      description: 'Choose the image format for this upload',
      components: {
        Field: {
          path: 'payload-img-convert/client#FormatSelectorComponent',
          clientProps: {
            formats,
            defaultFormat,
          },
        },
      },
    },
  }
}
