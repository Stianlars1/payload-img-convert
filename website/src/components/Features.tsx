"use client";

import { motion } from "framer-motion";
import { useRef, useState, type MouseEvent } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

function FeatureCard({ title, description, icon, className = "", children }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`group relative rounded-2xl bg-[--color-surface-2] border border-[--color-border-subtle] hover:border-[--color-border-hover] p-6 overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(99,102,241,0.08)] ${className}`}
    >
      {/* Mouse-tracking glow */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.06), transparent 70%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[--color-accent]/10 text-[--color-accent-glow] mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">{title}</h3>
        <p className="text-sm text-[--color-text-secondary] leading-relaxed">{description}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </motion.div>
  );
}

const FormatBadge = ({ name, color }: { name: string; color: string }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border"
    style={{
      borderColor: `${color}30`,
      backgroundColor: `${color}10`,
      color: color,
    }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
    .{name}
  </span>
);

export function Features() {
  return (
    <section id="features" className="relative px-6 py-32 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[--color-text-primary] mb-4">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <p className="text-lg text-[--color-text-secondary] max-w-xl">
          Drop it in, configure once, forget about image optimization forever.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Large card: Auto-conversion */}
        <FeatureCard
          className="md:col-span-2 md:row-span-2"
          title="Automatic Conversion"
          description="Images are converted on upload. No manual steps, no batch processing, no cron jobs. Upload a PNG, get a WebP. That simple."
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          {/* Visual demo */}
          <div className="mt-4 rounded-xl bg-[--color-surface-1] border border-[--color-border-subtle] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[--color-text-muted]">upload pipeline</span>
              <span className="text-xs font-mono text-[--color-success]">active</span>
            </div>
            <div className="space-y-2">
              {[
                { from: "hero-banner.png", to: "hero-banner.webp", savings: "82%", size: "2.4 MB → 432 KB" },
                { from: "product-shot.jpg", to: "product-shot.avif", savings: "91%", size: "1.8 MB → 162 KB" },
                { from: "icon-set.bmp", to: "icon-set.png", savings: "67%", size: "840 KB → 277 KB" },
              ].map((item) => (
                <div
                  key={item.from}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[--color-canvas] text-xs font-mono"
                >
                  <span className="text-[--color-text-muted] truncate flex-1">{item.from}</span>
                  <span className="text-[--color-text-muted]">→</span>
                  <span className="text-[--color-text-primary] truncate flex-1">{item.to}</span>
                  <span className="text-[--color-success] whitespace-nowrap">-{item.savings}</span>
                </div>
              ))}
            </div>
          </div>
        </FeatureCard>

        {/* Zero Config */}
        <FeatureCard
          title="Zero Config"
          description="Works out of the box. One line in your Payload config. Sensible defaults: WebP at quality 80."
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        {/* Format Selector */}
        <FeatureCard
          title="Admin UI Selector"
          description="Editors pick the format right in Payload's admin panel. No code needed per upload."
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          }
        >
          <div className="flex flex-wrap gap-2">
            <FormatBadge name="webp" color="#6366f1" />
            <FormatBadge name="avif" color="#22c55e" />
            <FormatBadge name="png" color="#eab308" />
            <FormatBadge name="jpeg" color="#ef4444" />
          </div>
        </FeatureCard>

        {/* Smart Resize */}
        <FeatureCard
          title="Smart Resize"
          description="Set maxWidth and maxHeight. Aspect ratio preserved. Never upscales. Never distorts."
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          }
        />

        {/* Re-convert */}
        <FeatureCard
          title="Re-convert Existing"
          description="Change the format of images already uploaded. No re-upload needed."
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />

        {/* Graceful Fallback */}
        <FeatureCard
          title="Graceful Fallback"
          description="Conversion fails? Original file stays intact. No broken uploads, ever."
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>
    </section>
  );
}
