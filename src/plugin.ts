import type { Config, Plugin } from 'payload'
import type { ImageConverterConfig } from './types.js'
import { DEFAULT_CONFIG } from './defaults.js'
import { createBeforeOperationHook } from './hooks/beforeOperation.js'
import { createFormatSelectorField } from './fields/formatSelector.js'

export const imageConverterPlugin =
  (pluginConfig: ImageConverterConfig): Plugin =>
  (incomingConfig: Config): Config => {
    const config = { ...DEFAULT_CONFIG, ...pluginConfig }

    // Always add the field for schema consistency (even if disabled)
    const updatedCollections = (incomingConfig.collections ?? []).map((collection) => {
      if (!config.collections.includes(collection.slug)) {
        return collection
      }

      // Warn if collection already has formatOptions (potential double-conversion)
      if (collection.upload && typeof collection.upload === 'object' && collection.upload.formatOptions) {
        console.warn(
          `payload-img-convert: Collection "${collection.slug}" already has formatOptions configured. ` +
            'This may cause double-conversion. Consider removing the collection-level formatOptions.',
        )
      }

      // Add the format selector field + hidden originalFilesize field
      const fields = [...(collection.fields || [])]
      if (config.enableFormatSelector) {
        fields.push(createFormatSelectorField(pluginConfig))
      }
      fields.push({
        name: 'originalFilesize',
        type: 'number',
        admin: { hidden: true, readOnly: true },
      })

      // If disabled, add field but skip hooks
      if (config.disabled) {
        return {
          ...collection,
          fields,
        }
      }

      // Add beforeOperation hook (prepend so conversion runs first)
      const beforeOperationHook = createBeforeOperationHook(pluginConfig, collection.slug)
      const existingBeforeOperation = collection.hooks?.beforeOperation ?? []

      return {
        ...collection,
        fields,
        hooks: {
          ...(collection.hooks ?? {}),
          beforeOperation: [beforeOperationHook, ...existingBeforeOperation],
        },
      }
    })

    return {
      ...incomingConfig,
      collections: updatedCollections,
    }
  }
