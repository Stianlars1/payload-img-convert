"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { QuickStart } from "@/components/QuickStart";
import { Formats } from "@/components/Formats";
import { ConfigOptions } from "@/components/ConfigOptions";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Formats />
        <QuickStart />
        <ConfigOptions />
      </main>
      <Footer />
    </>
  );
}
