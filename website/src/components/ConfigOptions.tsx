"use client";

import { motion } from "framer-motion";

interface ConfigOption {
  name: string;
  type: string;
  default: string;
  description: string;
}

const OPTIONS: ConfigOption[] = [
  { name: "collections", type: "string[]", default: "required", description: "Upload collection slugs to target" },
  { name: "defaultFormat", type: "ImageFormat", default: "'webp'", description: "Default output format for conversions" },
  { name: "quality", type: "number", default: "80", description: "Compression quality (0–100)" },
  { name: "maxWidth", type: "number", default: "undefined", description: "Max width in px. Aspect ratio preserved" },
  { name: "maxHeight", type: "number", default: "undefined", description: "Max height in px. No upscaling" },
  { name: "maxFileSize", type: "number", default: "undefined", description: "Skip files exceeding this size (bytes)" },
  { name: "enableFormatSelector", type: "boolean", default: "true", description: "Show format dropdown in admin UI" },
  { name: "formats", type: "ImageFormat[]", default: "all", description: "Available formats in the selector" },
  { name: "formatOptions", type: "FormatOptions", default: "{}", description: "Per-format Sharp options" },
  { name: "disabled", type: "boolean", default: "false", description: "Kill switch. Keeps field for schema consistency" },
];

export function ConfigOptions() {
  return (
    <section className="relative px-6 py-32 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[--color-text-primary] mb-4">
          Full control when you need it.
        </h2>
        <p className="text-lg text-[--color-text-secondary] max-w-xl">
          Every option is optional except <code className="text-sm font-mono text-[--color-accent-glow] bg-[--color-accent]/10 px-1.5 py-0.5 rounded">collections</code>. Sensible defaults handle the rest.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.1 }}
        className="rounded-2xl bg-[--color-surface-1] border border-[--color-border-subtle] overflow-hidden"
      >
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[--color-border-subtle] text-xs font-mono text-[--color-text-muted] uppercase tracking-wider">
          <div className="col-span-3">Option</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Default</div>
          <div className="col-span-5">Description</div>
        </div>

        {/* Rows */}
        {OPTIONS.map((opt, i) => (
          <div
            key={opt.name}
            className={`grid grid-cols-12 gap-4 px-6 py-3 text-sm items-center hover:bg-white/[0.02] transition-colors ${
              i < OPTIONS.length - 1 ? "border-b border-[--color-border-subtle]" : ""
            }`}
          >
            <div className="col-span-3">
              <code className="font-mono text-[--color-text-primary] text-xs">{opt.name}</code>
            </div>
            <div className="col-span-2">
              <code className="font-mono text-[--color-accent-glow] text-xs">{opt.type}</code>
            </div>
            <div className="col-span-2">
              <code className={`font-mono text-xs ${opt.default === "required" ? "text-[--color-warning]" : "text-[--color-text-muted]"}`}>
                {opt.default}
              </code>
            </div>
            <div className="col-span-5 text-[--color-text-secondary] text-xs">
              {opt.description}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
