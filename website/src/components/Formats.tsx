"use client";

import { motion } from "framer-motion";
import { useRef, useState, type MouseEvent } from "react";

interface Format {
  name: string;
  ext: string;
  color: string;
  description: string;
  pros: string[];
  bestFor: string;
}

const FORMATS: Format[] = [
  {
    name: "WebP",
    ext: ".webp",
    color: "#6366f1",
    description: "Best all-round choice. Small files, broad browser support, lossy and lossless modes.",
    pros: ["~82% smaller than PNG", "Transparency support", "Universal browser support"],
    bestFor: "General web usage",
  },
  {
    name: "AVIF",
    ext: ".avif",
    color: "#22c55e",
    description: "Next-gen format. Smallest files, best quality-to-size ratio. Slower encoding.",
    pros: ["~91% smaller than PNG", "HDR & wide gamut", "Superior compression"],
    bestFor: "Maximum compression",
  },
  {
    name: "PNG",
    ext: ".png",
    color: "#eab308",
    description: "Lossless compression. Pixel-perfect output for graphics, icons, and screenshots.",
    pros: ["Lossless quality", "Transparency", "Best for graphics"],
    bestFor: "Icons & screenshots",
  },
  {
    name: "JPEG",
    ext: ".jpeg",
    color: "#ef4444",
    description: "Universal compatibility. Fast encoding, supported everywhere, decent compression.",
    pros: ["Universal support", "Fast encoding", "Progressive loading"],
    bestFor: "Photos & legacy systems",
  },
];

function FormatCard({ format }: { format: Format }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative rounded-2xl bg-[--color-surface-2] border border-[--color-border-subtle] hover:border-[--color-border-hover] p-6 overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(99,102,241,0.06)]"
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, ${format.color}08, transparent 70%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono"
            style={{
              backgroundColor: `${format.color}15`,
              color: format.color,
            }}
          >
            {format.ext}
          </div>
          <div>
            <h3 className="font-semibold text-[--color-text-primary]">{format.name}</h3>
            <span className="text-xs font-mono text-[--color-text-muted]">{format.bestFor}</span>
          </div>
        </div>

        <p className="text-sm text-[--color-text-secondary] mb-4 leading-relaxed">
          {format.description}
        </p>

        <ul className="space-y-1.5">
          {format.pros.map((pro) => (
            <li key={pro} className="flex items-center gap-2 text-xs text-[--color-text-muted]">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: format.color }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {pro}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function Formats() {
  return (
    <section id="formats" className="relative px-6 py-32 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[--color-text-primary] mb-4">
          Four formats. Pick your weapon.
        </h2>
        <p className="text-lg text-[--color-text-secondary] max-w-xl">
          Convert to any format on the fly. Or let your editors choose per upload in the admin panel.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FORMATS.map((format) => (
          <FormatCard key={format.name} format={format} />
        ))}
      </div>
    </section>
  );
}
