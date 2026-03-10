# payload-img-convert

Automatic image conversion and resizing for [Payload CMS](https://payloadcms.com) v3.

[![npm version](https://img.shields.io/npm/v/payload-img-convert)](https://www.npmjs.com/package/payload-img-convert)
[![npm downloads](https://img.shields.io/npm/dm/payload-img-convert)](https://www.npmjs.com/package/payload-img-convert)
[![license](https://img.shields.io/npm/l/payload-img-convert)](./LICENSE)

---

**[Official Homepage](https://payload-img-convert-frontend.vercel.app/)** | **[GitHub Repository](https://github.com/stianlars1/payload-img-convert)**

---

## Why?

Payload 3 doesn't include built-in format conversion. Most sites need WebP or AVIF for performance, but manually converting every upload is tedious. This plugin handles it automatically — convert on upload, resize to fit constraints, and let editors pick the format from the admin UI.

## Features

- **Automatic format conversion** — WebP, AVIF, PNG, JPEG
- **Aspect-ratio preserving resize** — constrain by max width/height without distortion
- **Max file size gate** — skip conversion for oversized files
- **Per-format quality options** — fine-tune Sharp settings per format
- **Admin UI format selector** — dropdown in the upload sidebar
- **Re-conversion support** — change format on existing uploads
- **Graceful fallback** — if conversion fails, the original file is kept
- **Zero config defaults** — works out of the box with sensible defaults

## Quick Start

```bash
npm install payload-img-convert
```

```ts
// payload.config.ts
import { imageConverterPlugin } from 'payload-img-convert'

export default buildConfig({
  plugins: [
    imageConverterPlugin({
      collections: ['media'],
    }),
  ],
})
```

That's it. All images uploaded to the `media` collection will be converted to WebP at quality 80.

## Configuration

| Option                | Type             | Default     | Description                                                  |
| --------------------- | ---------------- | ----------- | ------------------------------------------------------------ |
| `collections`         | `string[]`       | *required*  | Upload collection slugs to target                            |
| `defaultFormat`       | `ImageFormat`    | `'webp'`    | Default output format                                        |
| `quality`             | `number`         | `80`        | Default quality (0–100)                                      |
| `formatOptions`       | `FormatOptions`  | `undefined` | Per-format Sharp options (see below)                         |
| `enableFormatSelector`| `boolean`        | `true`      | Show format dropdown in admin sidebar                        |
| `formats`             | `ImageFormat[]`  | All four    | Formats available in the dropdown                            |
| `disabled`            | `boolean`        | `false`     | Kill switch — disables conversion, keeps field for schema    |
| `maxWidth`            | `number`         | `undefined` | Max width in px (aspect ratio preserved, no upscaling)       |
| `maxHeight`           | `number`         | `undefined` | Max height in px (aspect ratio preserved, no upscaling)      |
| `maxFileSize`         | `number`         | `undefined` | Max file size in bytes — files exceeding this skip conversion|

### Full example

```ts
imageConverterPlugin({
  collections: ['media', 'avatars'],
  defaultFormat: 'avif',
  quality: 75,
  maxWidth: 2560,
  maxHeight: 1440,
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  formats: ['webp', 'avif', 'jpeg'],
  formatOptions: {
    webp: { quality: 85, effort: 4 },
    avif: { quality: 65, effort: 6 },
    jpeg: { quality: 80, progressive: true, mozjpeg: true },
  },
})
```

### Format options

Each format accepts the corresponding [Sharp output options](https://sharp.pixelplumbing.com/api-output):

| Format | Notable options                              |
| ------ | -------------------------------------------- |
| WebP   | `quality`, `lossless`, `nearLossless`, `effort` |
| AVIF   | `quality`, `lossless`, `effort`              |
| PNG    | `compressionLevel`, `palette`, `quality`, `effort` |
| JPEG   | `quality`, `progressive`, `mozjpeg`          |

## How It Works

The plugin registers a `beforeOperation` hook on each targeted collection. When an image is uploaded (or re-converted), the hook:

1. Reads the target format from the admin UI selector (or falls back to `defaultFormat`)
2. Checks file size against `maxFileSize` (skips if exceeded)
3. Resizes the image if `maxWidth` or `maxHeight` are set (aspect ratio preserved, no upscaling)
4. Converts to the target format using Sharp with the configured quality/options
5. Replaces the file data, MIME type, and extension on `req.file`

SVGs and GIFs are always skipped. If conversion fails, the original file is kept unchanged.

## Supported Formats

| Format | Extension | MIME Type    | Notes                                    |
| ------ | --------- | ------------ | ---------------------------------------- |
| WebP   | `.webp`   | `image/webp` | Best all-round choice, wide support      |
| AVIF   | `.avif`   | `image/avif` | Smaller files, slower encoding           |
| PNG    | `.png`    | `image/png`  | Lossless, good for graphics              |
| JPEG   | `.jpg`    | `image/jpeg` | Universal compatibility, lossy           |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) — Stian Larsen
