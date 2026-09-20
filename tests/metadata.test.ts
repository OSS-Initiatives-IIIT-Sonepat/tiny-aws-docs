import { describe, expect, it, vi } from "vitest";
import { buildPostMetadata } from "../src/lib/metadata";
import type { BlogPost } from "../src/lib/blog-types";

const samplePost: BlogPost = {
  slug: "frontend/how-browsers-work",
  segments: ["frontend", "how-browsers-work"],
  href: "/frontend/how-browsers-work",
  title: "How Browsers Work",
  description: "A classic post on browser internals",
  author: "Vengeance Blog",
  inspiredBy: "Classic essay",
  date: "2026-07-24",
  readingTime: "6 min",
  category: "Frontend",
  markdown: "## Intro",
  headings: [],
};

describe("buildPostMetadata", () => {
  it("includes Open Graph and Twitter fields for link previews", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://blog.example.com");

    const metadata = buildPostMetadata(samplePost);

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      title: "How Browsers Work",
      description: "A classic post on browser internals",
      url: "https://blog.example.com/frontend/how-browsers-work",
    });
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://blog.example.com/og/frontend/how-browsers-work",
        width: 1200,
        height: 630,
        alt: "How Browsers Work",
      },
    ]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "How Browsers Work",
    });

    vi.unstubAllEnvs();
  });

  it("uses a custom thumbnail frontmatter path when provided", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://blog.example.com");

    const metadata = buildPostMetadata({
      ...samplePost,
      thumbnail: "/custom-preview.png",
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://blog.example.com/custom-preview.png",
        width: 1200,
        height: 630,
        alt: "How Browsers Work",
      },
    ]);

    vi.unstubAllEnvs();
  });
});
