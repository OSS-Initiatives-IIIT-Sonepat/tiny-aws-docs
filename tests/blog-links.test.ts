import { describe, expect, it } from "vitest";
import {
  normalizeBlogMarkdownForSite,
  postsToLinkIndex,
} from "../src/lib/blog-links";
import type { BlogPost } from "../src/lib/blog-types";

const posts: BlogPost[] = [
  {
    slug: "frontend/how-browsers-work",
    segments: ["frontend", "how-browsers-work"],
    href: "/frontend/how-browsers-work",
    title: "How Browsers Work",
    description: "",
    author: "",
    inspiredBy: "",
    date: "2026-01-01",
    readingTime: "1 min",
    category: "Frontend",
    markdown: "Body",
    headings: [],
  },
  {
    slug: "frontend/css-layout-debug-playbook",
    segments: ["frontend", "css-layout-debug-playbook"],
    href: "/frontend/css-layout-debug-playbook",
    title: "CSS Layout Debug Playbook",
    description: "",
    author: "",
    inspiredBy: "",
    date: "2026-01-01",
    readingTime: "1 min",
    category: "Frontend",
    markdown: "Body",
    headings: [],
  },
];

describe("blog site links", () => {
  it("renders wikilinks as markdown routes for the website", () => {
    const index = postsToLinkIndex(posts);
    expect(
      normalizeBlogMarkdownForSite(
        "Start with [[css-layout-debug-playbook]].",
        index,
      ),
    ).toBe(
      "Start with [CSS Layout Debug Playbook](/frontend/css-layout-debug-playbook).",
    );
  });
});
