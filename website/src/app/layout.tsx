import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "payload-img-convert — Automatic Image Conversion for Payload CMS",
  description:
    "Zero-config Payload CMS plugin that automatically converts and resizes uploaded images to WebP, AVIF, PNG, or JPEG using Sharp.",
  keywords: [
    "payload",
    "payloadcms",
    "plugin",
    "webp",
    "avif",
    "image",
    "converter",
    "optimization",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
