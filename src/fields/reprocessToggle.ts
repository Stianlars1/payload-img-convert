import type { CheckboxField } from 'payload'
import { IMG_CONVERT_REPROCESS_FIELD_NAME } from '../defaults.js'

export function createReprocessToggleField(): CheckboxField {
  return {
    name: IMG_CONVERT_REPROCESS_FIELD_NAME,
    type: 'checkbox',
    label: 'Enable Reprocessing',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      components: {
        Field: {
          path: 'payload-img-convert/client#ReprocessToggleComponent',
        },
      },
    },
  }
}
