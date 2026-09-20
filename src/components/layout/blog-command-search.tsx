"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { BlogLink } from "@/lib/blog-types";
import { cn } from "@/lib/utils";

type SearchItem = {
  href: string;
  category: string;
  description: string;
  title: string;
  searchText: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseQueryTerms(query: string) {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function highlightText(text: string, terms: string[]) {
  if (!text) return text;
  if (terms.length === 0) return text;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "ig");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = terms.some(
      (term) => part.toLowerCase() === term.toLowerCase(),
    );
    if (!isMatch) return <span key={`${part}-${index}`}>{part}</span>;
    return (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-amber-200/90 px-0.5 text-foreground dark:bg-amber-400/35 dark:text-zinc-100"
      >
        {part}
      </mark>
    );
  });
}

function buildSnippet(text: string, terms: string[]) {
  if (!text) return "";
  if (terms.length === 0) return text.slice(0, 140);

  const lowered = text.toLowerCase();
  let firstMatch = -1;
  for (const term of terms) {
    const idx = lowered.indexOf(term);
    if (idx !== -1 && (firstMatch === -1 || idx < firstMatch)) {
      firstMatch = idx;
    }
  }

  if (firstMatch === -1) return text.slice(0, 140);
  const start = Math.max(0, firstMatch - 48);
  const end = Math.min(text.length, firstMatch + 120);
  const segment = text.slice(start, end).trim();

  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${segment}${suffix}`;
}

export function BlogCommandSearch({ links }: { links: BlogLink[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo<SearchItem[]>(() => {
    return links.map((post) => ({
      href: post.href,
      category: post.category,
      description: post.description,
      title: post.title,
      searchText: post.searchText,
    }));
  }, [links]);

  const filtered = useMemo(() => {
    const terms = parseQueryTerms(query);
    if (terms.length === 0) {
      return items.slice(0, 40).map((item) => ({
        ...item,
        score: 0,
        snippet: item.description || buildSnippet(item.searchText, terms),
      }));
    }

    const scored = items
      .map((item) => {
        const title = item.title.toLowerCase();
        const description = item.description.toLowerCase();
        const category = item.category.toLowerCase();
        const searchBody = item.searchText.toLowerCase();

        let score = 0;
        for (const term of terms) {
          if (title === term) score += 20;
          if (title.startsWith(term)) score += 12;
          if (title.includes(term)) score += 8;
          if (description.includes(term)) score += 6;
          if (category.includes(term)) score += 4;
          if (searchBody.includes(term)) score += 3;
        }

        const allTermsPresent = terms.every(
          (term) =>
            title.includes(term) ||
            description.includes(term) ||
            category.includes(term) ||
            searchBody.includes(term),
        );
        if (allTermsPresent) score += 10;

        return {
          ...item,
          score,
          snippet: item.description || buildSnippet(item.searchText, terms),
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);

    return scored;
  }, [items, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const openPost = (href: string) => {
    setOpen(false);
    setQuery("");
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex h-9 w-[260px] items-center justify-between rounded-md border border-foreground/10 bg-foreground/[0.035] px-3 text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-foreground/15 hover:bg-foreground/[0.055] hover:text-foreground",
          "dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-white/15 dark:hover:bg-white/[0.06]",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Search className="size-4 shrink-0 opacity-65 transition-opacity group-hover:opacity-90" />
          <span className="truncate">Search posts...</span>
        </span>
        <kbd className="ml-3 rounded border border-foreground/10 bg-background/80 px-1.5 py-0.5 font-mono text-[11px] leading-none text-muted-foreground shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
          Ctrl K
        </kbd>
      </button>

      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[260] flex items-start justify-center p-4 pt-[12vh] transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
        <div
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-foreground/10 bg-background/95 shadow-2xl backdrop-blur-xl transition-all duration-200",
            open ? "translate-y-0 scale-100" : "-translate-y-1 scale-[0.985]",
          )}
        >
          <div className="flex items-center gap-2 border-b border-foreground/10 px-3 py-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search posts, topics, categories..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
            />
          </div>

          <div className="max-h-[min(70vh,520px)] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No result found.
              </p>
            ) : (
              filtered.map((item) => {
                const terms = parseQueryTerms(query);
                const highlightedTitle = highlightText(item.title, terms);
                const highlightedSnippet = highlightText(item.snippet, terms);

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => openPost(item.href)}
                    className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-foreground/[0.04]"
                  >
                    <span className="mt-0.5 rounded-md border border-foreground/10 bg-foreground/[0.04] px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {highlightText(item.category, terms)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {highlightedTitle}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {highlightedSnippet}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
