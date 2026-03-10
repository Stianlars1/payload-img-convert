import type { UIField } from 'payload'

export function createImageInfoBadgeField(): UIField {
  return {
    name: 'imageInfoBadge',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: {
        Field: {
          path: 'payload-img-convert/client#ImageInfoBadgeComponent',
        },
      },
    },
  }
}
