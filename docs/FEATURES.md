# payload-img-convert — Feature Reference

> Payload CMS plugin that automatically converts and resizes uploaded images to WebP, AVIF, or other formats using Sharp.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration Options](#configuration-options)
- [Supported Formats](#supported-formats)
- [Per-Format Sharp Options](#per-format-sharp-options)
- [Conversion Pipeline](#conversion-pipeline)
- [Resize Pipeline](#resize-pipeline)
- [Admin UI Components](#admin-ui-components)
- [Field Definitions](#field-definitions)
- [Skip & Guard Logic](#skip--guard-logic)
- [Guarded Re-Conversion (Update Without Re-Upload)](#guarded-re-conversion-update-without-re-upload)
- [Quality Degradation Warnings](#quality-degradation-warnings)
- [File Size Savings Display](#file-size-savings-display)
- [Oversize Image Detection](#oversize-image-detection)
- [Kill Switch (Disabled Mode)](#kill-switch-disabled-mode)
- [Double-Conversion Warning](#double-conversion-warning)
- [Graceful Failure](#graceful-failure)
- [Package Exports](#package-exports)
- [Peer Dependencies](#peer-dependencies)
- [All Features at a Glance](#all-features-at-a-glance)

---

## Quick Start

```ts
import { imageConverterPlugin } from 'payload-img-convert'

export default buildConfig({
  plugins: [
    imageConverterPlugin({
      collections: ['media'],
    }),
  ],
})
```

All uploads to the `media` collection are now automatically converted to **WebP at quality 80** — with a format selector and resize panel in the admin sidebar.

---

## Configuration Options

| Option                 | Type              | Default     | Description                                                                 |
| ---------------------- | ----------------- | ----------- | --------------------------------------------------------------------------- |
| `collections`          | `string[]`        | _(required)_ | Upload collection slugs to target.                                         |
| `defaultFormat`        | `ImageFormat`     | `'webp'`    | Format used when no per-image selection is made.                            |
| `quality`              | `number`          | `80`        | Global quality (0–100). Can be overridden per-format via `formatOptions`.   |
| `formatOptions`        | `FormatOptions`   | `undefined` | Per-format Sharp options (see below).                                       |
| `enableFormatSelector` | `boolean`         | `true`      | Show the format dropdown in the upload sidebar.                             |
| `enableResizeSelector` | `boolean`         | `true`      | Show the resize dimension inputs in the upload sidebar.                     |
| `formats`              | `ImageFormat[]`   | All four    | Formats available in the dropdown. Default: `['webp', 'avif', 'png', 'jpeg']`. |
| `disabled`             | `boolean`         | `false`     | Kill switch — disables conversion but keeps fields for schema consistency.  |
| `maxWidth`             | `number`          | `undefined` | Global max width in pixels. Aspect ratio is preserved.                      |
| `maxHeight`            | `number`          | `undefined` | Global max height in pixels. Aspect ratio is preserved.                     |
| `maxFileSize`          | `number`          | `undefined` | Max file size in bytes. Files exceeding this are skipped (not converted).   |
| `oversizeThreshold`    | `number`          | `2500`      | Pixel threshold for the oversize image warning in the admin UI.             |

### Full Example

```ts
imageConverterPlugin({
  collections: ['media', 'avatars'],
  defaultFormat: 'avif',
  quality: 75,
  formats: ['webp', 'avif'],
  maxWidth: 1920,
  maxHeight: 1080,
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  oversizeThreshold: 2000,
  formatOptions: {
    avif: { quality: 60, effort: 4 },
    webp: { quality: 80, lossless: false },
  },
})
```

---

## Supported Formats

| Format | MIME Type     | Extension | Label  |
| ------ | ------------ | --------- | ------ |
| `webp` | `image/webp` | `.webp`   | WebP   |
| `avif` | `image/avif` | `.avif`   | AVIF   |
| `png`  | `image/png`  | `.png`    | PNG    |
| `jpeg` | `image/jpeg` | `.jpg`    | JPEG   |

---

## Per-Format Sharp Options

Each format accepts a subset of [Sharp's output options](https://sharp.pixelplumbing.com/api-output):

### WebP

| Option         | Type      | Description                       |
| -------------- | --------- | --------------------------------- |
| `quality`      | `number`  | Quality 1–100.                    |
| `lossless`     | `boolean` | Enable lossless compression.      |
| `nearLossless` | `boolean` | Enable near-lossless compression. |
| `effort`       | `number`  | CPU effort 0–6.                   |

### AVIF

| Option     | Type      | Description                  |
| ---------- | --------- | ---------------------------- |
| `quality`  | `number`  | Quality 1–100.               |
| `lossless` | `boolean` | Enable lossless compression. |
| `effort`   | `number`  | CPU effort 0–9.              |

### PNG

| Option             | Type      | Description                |
| ------------------ | --------- | -------------------------- |
| `compressionLevel` | `number`  | zlib compression 0–9.      |
| `palette`          | `boolean` | Enable palette mode.       |
| `quality`          | `number`  | Quality 1–100 (palette).   |
| `effort`           | `number`  | CPU effort 1–10.           |

### JPEG

| Option        | Type      | Description                  |
| ------------- | --------- | ---------------------------- |
| `quality`     | `number`  | Quality 1–100.               |
| `progressive` | `boolean` | Enable progressive encoding. |
| `mozjpeg`     | `boolean` | Use mozjpeg encoder.         |

```ts
formatOptions: {
  webp: { quality: 85, effort: 4 },
  avif: { quality: 60, lossless: false },
  png:  { compressionLevel: 9, palette: true },
  jpeg: { quality: 90, progressive: true, mozjpeg: true },
}
```

---

## Conversion Pipeline

The plugin hooks into Payload's `beforeOperation` lifecycle on **create** and **update** operations:

```
Upload received
  │
  ├─ Is image? (mime starts with image/)
  ├─ Not SVG or GIF? (these are skipped)
  ├─ Under maxFileSize?
  ├─ Needs format change or resize?
  │
  ▼
Sharp pipeline
  │
  ├─ .resize({ width, height, fit: 'inside', withoutEnlargement: true })
  ├─ .toFormat(targetFormat, { quality, ...formatOptions })
  ├─ .toBuffer({ resolveWithObject: true })
  │
  ▼
Mutate req.file in place
  ├─ data   → converted buffer
  ├─ mimetype → new MIME type
  ├─ name   → original stem + new extension
  └─ size   → actual output size
```

**Key behaviors:**

- The hook is **prepended** to existing `beforeOperation` hooks so conversion runs first.
- If only resizing (no format change), the image is resized in its **current format** — avoiding unnecessary re-encoding.
- The original file size is stored in a hidden `originalFilesize` field for savings calculation.
- A hidden `imgConvertProcessed` flag protects already-processed images from accidental reprocessing.
- Sharp is obtained from `req.payload.config.sharp` (Payload's managed instance) — no separate Sharp dependency.

---

## Resize Pipeline

Resize uses Sharp's `resize()` with these constraints:

| Parameter            | Value     | Meaning                                             |
| -------------------- | --------- | --------------------------------------------------- |
| `fit`                | `'inside'` | Image fits within the bounding box.                |
| `withoutEnlargement` | `true`    | Small images are never upscaled.                    |

Dimension sources (in priority order):

1. **Per-image UI value** — `resizeMaxWidth` / `resizeMaxHeight` fields set by the editor.
2. **Global config** — `maxWidth` / `maxHeight` from the plugin config.
3. **No resize** — if neither is set, the image keeps its original dimensions.

---

## Admin UI Components

### FormatSelector

**Location:** Upload sidebar
**Component:** `FormatSelectorComponent` (`src/components/FormatSelector.tsx`)
**Field name:** `convertFormat`

A dropdown built on Payload's `SelectInput` that lets editors choose the output format per upload. Features:

- Populated from the `formats` config array with human-readable labels (WebP, AVIF, PNG, JPEG).
- Defaults to the `defaultFormat` config value.
- Locks itself for already-processed stored images until reprocessing is explicitly enabled.
- Shows **file size savings** after conversion (e.g., "Saved 42% (1.2 MB → 700 KB)") when the converted file is smaller than the original.
- Shows a **quality warning** when the selected format differs from the current image's MIME type on an existing document (re-conversion scenario).

### ReprocessToggle

**Location:** Upload sidebar
**Component:** `ReprocessToggleComponent` (`src/components/ReprocessToggle.tsx`)
**Field name:** `imgConvertReprocess`

A guarded checkbox for already-processed stored images. Features:

- Shows a warning banner when the current asset has already been processed.
- Requires an explicit one-shot opt-in before an existing file can be reprocessed.
- Automatically resets to `false` after every update save.
- Stays hidden during fresh uploads, because new files process automatically.

### ResizeSelector

**Location:** Upload sidebar
**Component:** `ResizeSelectorComponent` (`src/components/ResizeSelector.tsx`)
**Field names:** `resizeMaxWidth`, `resizeMaxHeight`

A collapsible panel with two number inputs for max width and max height. Features:

- **Collapsible** — collapsed by default, auto-expands when values are present. Shows "(active)" badge when dimensions are set.
- **Oversize image warning** — when an uploaded image exceeds the `oversizeThreshold` (default 2500px), a yellow warning banner appears with the current dimensions.
- **Auto-fill button** — within the oversize warning, a one-click button sets max width to the threshold value.
- Locks its inputs for already-processed stored images until reprocessing is explicitly enabled.
- Displays "Aspect ratio preserved, no upscaling." hint.
- Reads actual image dimensions from Payload's `width` and `height` fields.

---

## Field Definitions

The plugin injects the following fields into targeted collections:

| Field Name          | Type     | Position  | Visibility | Purpose                                       |
| ------------------- | -------- | --------- | ---------- | --------------------------------------------- |
| `imgConvertReprocess` | `checkbox` | Sidebar | Visible | One-shot opt-in for reprocessing an existing stored image. |
| `convertFormat`     | `select` | Sidebar   | Visible    | Format selector dropdown (when enabled).       |
| `resizeMaxWidth`    | `number` | Sidebar   | Visible    | Max width input via custom component.          |
| `resizeMaxHeight`   | `number` | Sidebar   | Hidden     | Max height (managed by ResizeSelector component). |
| `originalFilesize`  | `number` | —         | Hidden     | Stores pre-conversion file size for savings UI. |
| `imgConvertProcessed` | `checkbox` | —      | Hidden     | Tracks whether the current stored file was processed by the plugin. |

- `imgConvertReprocess` uses a custom admin component (`ReprocessToggleComponent`) that shows the protection banner and explicit opt-in checkbox for stored assets.
- `convertFormat` uses a custom admin component (`FormatSelectorComponent`) that replaces the default select field with savings/warning UI.
- `resizeMaxWidth` uses a custom admin component (`ResizeSelectorComponent`) that renders both width and height inputs plus the oversize warning.
- `resizeMaxHeight` is hidden from the admin panel and managed programmatically by the ResizeSelector component.
- Fields are **always added** (even when `disabled: true`) to maintain schema consistency across environments.

---

## Skip & Guard Logic

The conversion pipeline includes several skip conditions:

| Condition                              | Behavior                              |
| -------------------------------------- | ------------------------------------- |
| Operation is not `create` or `update`  | Hook returns early.                   |
| No `req.file` on create                | Hook returns early.                   |
| MIME type is `image/svg+xml`           | Skipped — SVGs are not raster images. |
| MIME type is `image/gif`               | Skipped — preserves animation.        |
| MIME doesn't start with `image/`       | Skipped — not an image.              |
| Already in target format AND no resize | Skipped — no work needed.            |
| Processed update without `imgConvertReprocess` | Skipped — existing processed file stays untouched. |
| Reprocess requested but settings unchanged | Skipped — metadata saves still proceed. |
| File size exceeds `maxFileSize`        | Skipped with a logger warning.        |
| Sharp not available on Payload config  | Skipped with a logger warning.        |
| `disabled: true` in config             | No hook is registered at all.         |

---

## Guarded Re-Conversion (Update Without Re-Upload)

When an editor wants to reprocess an **already-processed** image without uploading a new file:

1. The hook detects `operation === 'update'` with no `req.file`.
2. If `imgConvertReprocess` is not enabled, it returns early and leaves the stored asset untouched.
3. Compares submitted format/resize values against the values already stored on the document.
4. Only if those settings changed, it fetches the existing document by ID, downloads the stored file, and runs the Sharp pipeline on the fetched buffer.
5. Sets `req.file` with the converted data — Payload processes it as a new upload.
6. Resets `imgConvertReprocess` back to `false` so the opt-in only applies to that save.
7. Applies the same `maxFileSize` check on the fetched buffer.

This prevents routine metadata edits from degrading already-processed images while still allowing deliberate one-off reprocessing from the admin panel.

---

## Quality Degradation Warnings

Two layers of quality warnings protect editors from lossy-to-lossy degradation:

### Admin UI Warning (FormatSelector)

When the selected format's MIME type differs from the current document's MIME type, a yellow warning appears:

> "Re-converting may reduce quality. For best results, upload the original file."

### Server-Side Logger Warning

When re-converting between lossy formats (`image/jpeg`, `image/webp`, `image/avif`), a warning is logged:

> "Re-converting between lossy formats will degrade quality. For best results, upload the original file."

---

## File Size Savings Display

After conversion, the FormatSelector shows savings when the converted file is smaller:

```
Saved 42% (1.2 MB → 700 KB)
```

- Compares `originalFilesize` (stored pre-conversion) against `filesize` (post-conversion).
- Only displayed when `originalFilesize > filesize`.
- Uses a human-readable format: B, KB, MB.
- Styled with Payload's `--theme-success-500` color.

---

## Oversize Image Detection

The ResizeSelector component detects oversized images and nudges editors to resize:

- **Trigger:** image `width` or `height` exceeds `oversizeThreshold` (default: 2500px).
- **Warning banner:** "Image is {width}x{height}px — consider resizing for better web performance."
- **Auto-fill button:** "Auto-fill max width ({threshold}px)" — one click sets the width field to the threshold value.
- The panel auto-expands when resize values are present.

---

## Kill Switch (Disabled Mode)

Setting `disabled: true` in the config:

- **Fields are still injected** into collections — database schema remains consistent.
- **No `beforeOperation` hook is registered** — no conversion or resize runs.
- Useful for disabling conversion in staging/development without schema drift.

---

## Double-Conversion Warning

If a targeted collection already has `formatOptions` configured at the collection level (Payload's built-in image handling), the plugin logs a console warning at startup:

> "Collection "{slug}" already has formatOptions configured. This may cause double-conversion. Consider removing the collection-level formatOptions."

---

## Graceful Failure

All Sharp processing is wrapped in try/catch:

- On failure, the **original file is preserved unchanged**.
- A warning is logged: `"Failed to process image (format: {format}). Keeping original. Error: {message}"`.
- No error is thrown — the upload proceeds with the original file.

---

## Package Exports

The package exposes three entry points:

| Import Path                  | Resolves To                   | Contents                                            |
| ---------------------------- | ----------------------------- | --------------------------------------------------- |
| `payload-img-convert`        | `dist/index.js`               | `imageConverterPlugin` function, TypeScript types.   |
| `payload-img-convert/types`  | `dist/exports/types.js`       | `ImageConverterConfig`, `ImageFormat`, `FormatOptions` type re-exports. |
| `payload-img-convert/client` | `dist/exports/client.js`      | `FormatSelectorComponent`, `ReprocessToggleComponent`, `ResizeSelectorComponent` (React, `'use client'`). |

The `/client` export is used internally by the custom field components and is marked `'use client'` for Next.js RSC compatibility.

---

## Peer Dependencies

| Package          | Version  |
| ---------------- | -------- |
| `payload`        | `^3.0.0` |
| `@payloadcms/ui` | `^3.0.0` |

Sharp is **not** a peer dependency — it is consumed from Payload's managed instance via `req.payload.config.sharp`.

---

## All Features at a Glance

1. **Automatic format conversion** — converts fresh uploads to WebP, AVIF, PNG, or JPEG.
2. **Per-image format selection** — editors choose the format from a sidebar dropdown.
3. **Global default format** — falls back to `defaultFormat` when no per-image selection is made.
4. **Configurable quality** — global `quality` setting (0–100) with per-format overrides.
5. **Per-format Sharp options** — fine-grained control over WebP, AVIF, PNG, and JPEG encoding.
6. **Image resizing** — constrain dimensions via global config or per-image sidebar inputs.
7. **Aspect ratio preservation** — resize uses `fit: 'inside'` to maintain proportions.
8. **No upscaling** — `withoutEnlargement: true` prevents small images from being enlarged.
9. **Guarded re-conversion without re-upload** — already-processed images only reprocess after an explicit one-shot opt-in.
10. **File size savings display** — shows percentage and byte savings after conversion.
11. **Quality degradation warnings** — UI and server-side warnings for lossy-to-lossy re-conversion.
12. **Oversize image detection** — warns editors when images exceed a pixel threshold.
13. **Auto-fill resize suggestion** — one-click button sets max width to the threshold value.
14. **SVG and GIF skip** — vector and animated images are passed through unchanged.
15. **Max file size guard** — files exceeding `maxFileSize` are skipped with a warning.
16. **Kill switch** — `disabled: true` stops conversion while keeping schema consistent.
17. **Double-conversion warning** — detects conflicting collection-level `formatOptions`.
18. **Graceful failure** — Sharp errors are caught; originals are preserved.
19. **Schema consistency** — fields are always injected, even when disabled.
20. **Hook prepend order** — conversion runs before other `beforeOperation` hooks.
21. **No Sharp dependency** — uses Payload's managed Sharp instance.
22. **Collapsible resize panel** — clean UI with auto-expand and "(active)" badge.
23. **Format-aware re-encoding** — resize-only operations skip format change to avoid quality loss.
24. **Original file size tracking** — hidden `originalFilesize` field powers the savings UI.
25. **Processed-state protection** — hidden `imgConvertProcessed` state protects previously processed assets from accidental reruns.
26. **Three package exports** — main, `/types`, and `/client` entry points for clean imports.
