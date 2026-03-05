"use client";

import { motion } from "framer-motion";

const BASIC_CODE = `import { buildConfig } from 'payload'
import { imageConverterPlugin } from 'payload-img-convert'

export default buildConfig({
  // ...your config
  plugins: [
    imageConverterPlugin({
      collections: ['media'],
    }),
  ],
})`;

const ADVANCED_CODE = `imageConverterPlugin({
  collections: ['media', 'assets'],
  defaultFormat: 'avif',
  quality: 90,
  maxWidth: 1920,
  maxHeight: 1080,
  maxFileSize: 10_000_000,   // skip files > 10 MB
  enableFormatSelector: true,
  formats: ['webp', 'avif', 'png'],
  formatOptions: {
    webp:  { quality: 85 },
    avif:  { quality: 70, effort: 4 },
    png:   { compressionLevel: 9 },
    jpeg:  { quality: 80, progressive: true },
  },
})`;

function CodeBlock({ code, title, badge }: { code: string; title: string; badge?: string }) {
  return (
    <div className="code-block">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[--color-border-subtle]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white/[0.06]" />
            <span className="w-3 h-3 rounded-full bg-white/[0.06]" />
            <span className="w-3 h-3 rounded-full bg-white/[0.06]" />
          </div>
          <span className="text-xs font-mono text-[--color-text-muted]">{title}</span>
        </div>
        {badge && (
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[--color-accent]/10 text-[--color-accent-glow]">
            {badge}
          </span>
        )}
      </div>
      <pre className="px-5 py-4 text-sm font-mono leading-relaxed overflow-x-auto">
        <code>
          {code.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none w-8 text-right pr-4 text-[--color-text-muted]/40 text-xs leading-relaxed">
                {i + 1}
              </span>
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightSyntax(line),
                }}
              />
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function highlightSyntax(line: string): string {
  return line
    // strings
    .replace(
      /('([^']*)')/g,
      '<span style="color: #22c55e">$1</span>'
    )
    // keywords
    .replace(
      /\b(import|from|export|default|const)\b/g,
      '<span style="color: #818cf8">$1</span>'
    )
    // comments
    .replace(
      /(\/\/.*)/g,
      '<span style="color: #6b6b80">$1</span>'
    )
    // numbers
    .replace(
      /\b(\d[\d_]*)\b/g,
      '<span style="color: #eab308">$1</span>'
    )
    // booleans
    .replace(
      /\b(true|false)\b/g,
      '<span style="color: #ef4444">$1</span>'
    );
}

export function QuickStart() {
  return (
    <section id="quickstart" className="relative px-6 py-32 max-w-6xl mx-auto">
      {/* Background accent */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[--color-accent]/[0.03] rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[--color-text-primary] mb-4">
          Three lines. Done.
        </h2>
        <p className="text-lg text-[--color-text-secondary] max-w-xl">
          Add the plugin to your Payload config. Images convert on upload from that point on.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <CodeBlock code={BASIC_CODE} title="payload.config.ts" badge="basic" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.1 }}
        >
          <CodeBlock code={ADVANCED_CODE} title="payload.config.ts" badge="advanced" />
        </motion.div>
      </div>

      {/* Steps */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            step: "01",
            title: "Install",
            desc: "npm install payload-img-convert",
            mono: true,
          },
          {
            step: "02",
            title: "Configure",
            desc: "Add the plugin to your payload.config.ts with your upload collections.",
            mono: false,
          },
          {
            step: "03",
            title: "Upload",
            desc: "Every image gets converted and resized automatically. Zero friction.",
            mono: false,
          },
        ].map((item) => (
          <div
            key={item.step}
            className="flex items-start gap-4 p-5 rounded-xl bg-[--color-surface-1] border border-[--color-border-subtle]"
          >
            <span className="text-2xl font-extrabold text-[--color-accent]/30 font-mono">
              {item.step}
            </span>
            <div>
              <h4 className="font-semibold text-[--color-text-primary] mb-1">{item.title}</h4>
              <p className={`text-sm ${item.mono ? "font-mono text-[--color-accent-glow]" : "text-[--color-text-secondary]"}`}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
