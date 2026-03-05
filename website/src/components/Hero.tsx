"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const COMMANDS = [
  { text: "Upload photo.png → converted to WebP (82% smaller)", format: "webp" },
  { text: "Upload banner.jpg → converted to AVIF (91% smaller)", format: "avif" },
  { text: "Upload hero.bmp → converted to PNG (lossless)", format: "png" },
  { text: "Resize 4000×3000 → 1920×1440 (aspect preserved)", format: "resize" },
];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const command = COMMANDS[currentIndex];
    let charIndex = 0;
    setDisplayText("");
    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (charIndex < command.text.length) {
        setDisplayText(command.text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % COMMANDS.length);
        }, 2400);
      }
    }, 32);

    return () => clearInterval(typeInterval);
  }, [currentIndex]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[--color-accent]/[0.04] rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        className="text-center max-w-4xl mx-auto relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-[--color-accent]/10 border border-[--color-accent]/20 text-[--color-accent-glow] text-sm font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[--color-success] animate-pulse" />
          v1.0.0 — Payload CMS v3 Plugin
        </motion.div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-[--color-text-primary] mb-6">
          Images, converted.{" "}
          <span className="bg-gradient-to-r from-[--color-accent] to-[--color-accent-glow] bg-clip-text text-transparent">
            Automatically.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-[--color-text-secondary] max-w-2xl mx-auto mb-12 leading-relaxed">
          Zero-config image conversion for Payload CMS. Upload once, get WebP, AVIF, PNG, or
          JPEG. Resize on the fly. No extra steps.
        </p>

        {/* Simulated command bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 25 }}
          className="relative max-w-2xl mx-auto"
        >
          <div className="glow-border rounded-2xl">
            <div className="relative bg-[--color-surface-1] border border-[--color-border-subtle] rounded-2xl p-1">
              {/* Command bar header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[--color-border-subtle]">
                <div className="flex items-center gap-2 text-[--color-text-muted] text-sm font-mono">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  payload-img-convert
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentIndex}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="px-2 py-0.5 rounded-md text-xs font-mono bg-[--color-accent]/10 text-[--color-accent-glow]"
                    >
                      .{COMMANDS[currentIndex].format}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Command output */}
              <div className="px-5 py-4 min-h-[56px] flex items-center">
                <span className="text-[--color-accent] font-mono text-sm mr-2">→</span>
                <span className="font-mono text-sm text-[--color-text-primary]">
                  {displayText}
                  {isTyping && (
                    <span className="inline-block w-[2px] h-[14px] bg-[--color-accent] ml-0.5 animate-pulse align-middle" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Install command */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <code className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[--color-surface-1] border border-[--color-border-subtle] text-sm font-mono text-[--color-text-secondary] select-all cursor-pointer hover:border-[--color-border-hover] transition-colors">
            <span className="text-[--color-accent]">$</span> npm install payload-img-convert
          </code>
          <a
            href="https://github.com/stianlars1/payload-img-convert"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-[--color-text-secondary] hover:text-[--color-text-primary] border border-[--color-border-subtle] hover:border-[--color-border-hover] transition-colors"
          >
            View on GitHub
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
