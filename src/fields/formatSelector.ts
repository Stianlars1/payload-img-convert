import type { SelectField } from 'payload'
import type { ResolvedConfig } from '../types.js'
import { FORMAT_LABELS, FORMAT_SELECTOR_FIELD_NAME } from '../defaults.js'

export function createFormatSelectorField(config: ResolvedConfig): SelectField {
  return {
    name: FORMAT_SELECTOR_FIELD_NAME,
    type: 'select',
    label: 'Convert to Format',
    defaultValue: config.defaultFormat,
    options: config.formats.map((format) => ({
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
            formats: config.formats,
            defaultFormat: config.defaultFormat,
          },
        },
      },
    },
  }
}
