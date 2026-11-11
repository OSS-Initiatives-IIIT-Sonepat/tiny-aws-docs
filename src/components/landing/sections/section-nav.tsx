"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#what-it-is", label: "What it is" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#speed", label: "The code" },
  { href: "#get-started", label: "Get started" },
  { href: "#replies", label: "Replies" },
  { href: "#faq", label: "FAQ" },
] as const;

const linkClass = (active: boolean) =>
  `inline-flex h-9 items-center rounded-[10px] px-2.5 text-[14px] font-medium transition-colors duration-150 ${
    active ? "text-fg" : "text-fg-muted hover:text-fg"
  }`;

export function SectionNav() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.href.slice(1))).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="On this page" className="hidden min-w-0 items-center justify-center xl:flex">
      {LINKS.map((link) => (
        <a key={link.href} href={link.href} className={linkClass(active === link.href.slice(1))}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export function SectionMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="section-menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center rounded-[10px] px-3 text-[14px] font-medium text-fg-muted transition-colors duration-150 hover:text-fg xl:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <nav
          id="section-menu"
          aria-label="On this page"
          className="absolute inset-x-0 top-16 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur-md sm:px-6 xl:hidden"
        >
          <ul className="mx-auto grid max-w-[1200px] gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`${linkClass(false)} w-full`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
