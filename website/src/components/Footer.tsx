"use client";

export function Footer() {
  return (
    <footer className="border-t border-[--color-border-subtle] bg-[--color-canvas]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[--color-accent] text-white text-xs font-bold">
                P
              </span>
              <span className="font-semibold text-[--color-text-primary] text-sm">
                payload-img-convert
              </span>
            </div>
            <p className="text-xs text-[--color-text-muted] leading-relaxed">
              Automatic image conversion for Payload CMS v3. Built with Sharp.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold text-[--color-text-primary] uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Documentation", href: "https://github.com/stianlars1/payload-img-convert#readme" },
                { label: "npm Package", href: "https://www.npmjs.com/package/payload-img-convert" },
                { label: "Changelog", href: "https://github.com/stianlars1/payload-img-convert/releases" },
                { label: "Contributing", href: "https://github.com/stianlars1/payload-img-convert/blob/main/CONTRIBUTING.md" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h4 className="text-xs font-semibold text-[--color-text-primary] uppercase tracking-wider mb-4">
              Built With
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Payload CMS v3", href: "https://payloadcms.com" },
                { label: "Sharp", href: "https://sharp.pixelplumbing.com" },
                { label: "TypeScript", href: "https://www.typescriptlang.org" },
                { label: "React", href: "https://react.dev" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold text-[--color-text-primary] uppercase tracking-wider mb-4">
              Links
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "GitHub", href: "https://github.com/stianlars1/payload-img-convert" },
                { label: "Issues", href: "https://github.com/stianlars1/payload-img-convert/issues" },
                { label: "License (MIT)", href: "https://github.com/stianlars1/payload-img-convert/blob/main/LICENSE" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-[--color-border-subtle] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[--color-text-muted]">
            &copy; {new Date().getFullYear()} Stian Larsen. MIT License.
          </p>
          <div className="flex items-center gap-1 text-xs text-[--color-text-muted]">
            <span>Built for</span>
            <a
              href="https://payloadcms.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors font-medium"
            >
              Payload CMS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
