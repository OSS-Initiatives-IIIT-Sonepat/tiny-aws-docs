import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero/hero";
import { WhatItIs } from "@/components/landing/sections/what-it-is";
import { Connect } from "@/components/landing/sections/connect";
import { Faq } from "@/components/landing/sections/faq";
import { HowItWorks } from "@/components/landing/sections/how-it-works";
import { SiteFooter } from "@/components/landing/sections/site-footer";
import { SiteHeader } from "@/components/landing/sections/site-header";
import { Speed } from "@/components/landing/sections/speed";
import { Testimonials } from "@/components/landing/sections/testimonials";
import { StructuredData } from "@/components/landing/structured-data";
import { RevealObserver } from "@/components/landing/ui/reveal-observer";
import { site } from "@/lib/landing/site";

export const metadata: Metadata = {
  title: { absolute: site.title },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.description,
    url: "/",
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export default function HomePage() {
  return (
    <div className="tinyaws-landing min-h-screen bg-bg text-fg">
      <a
        href="#main"
        className="sr-only z-[60] rounded-[6px] bg-panel-2 px-3 py-2 font-mono text-[12.5px] text-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <WhatItIs />
        <HowItWorks />
        <Speed />
        <Connect />
        <Testimonials />
        <Faq />
      </main>
      <SiteFooter />
      <RevealObserver />
      <StructuredData />
    </div>
  );
}
