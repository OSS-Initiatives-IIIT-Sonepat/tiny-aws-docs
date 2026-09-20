import { describe, expect, it } from "vitest";
import {
  getBlogCategories,
  getBlogLinks,
  getMarkdownHeadings,
  slugifyHeading,
} from "../src/lib/blog-server";
import type { BlogPost } from "../src/lib/blog-types";

function createPost(
  input: Partial<BlogPost> & Pick<BlogPost, "slug">,
): BlogPost {
  const segments = input.segments ?? input.slug.split("/");
  return {
    slug: input.slug,
    segments,
    href: input.href ?? `/${input.slug}`,
    title: input.title ?? input.slug,
    description: input.description ?? "",
    author: input.author ?? "Test",
    inspiredBy: input.inspiredBy ?? "Test",
    date: input.date ?? "2026-01-01",
    readingTime: input.readingTime ?? "1 min",
    isNew: input.isNew ?? false,
    category: input.category ?? "General",
    markdown: input.markdown ?? "",
    headings: input.headings ?? [],
  };
}

describe("blog server helpers", () => {
  it("slugifies headings with punctuation and spacing", () => {
    expect(slugifyHeading("  CAP Theorem: Why?  ")).toBe("cap-theorem-why");
  });

  it("extracts h2 and h3 headings with deduplicated ids", () => {
    const headings = getMarkdownHeadings(
      "## Intro\n### Details\n## Intro\n### Details",
    );
    expect(headings.map((heading) => heading.id)).toEqual([
      "intro",
      "details",
      "intro-2",
      "details-2",
    ]);
    expect(headings.map((heading) => heading.depth)).toEqual([2, 3, 2, 3]);
  });

  it("groups categories by folder slug and sorts about first", () => {
    const posts = [
      createPost({ slug: "systems/zeta", title: "Zeta" }),
      createPost({ slug: "about/intro", title: "Intro" }),
      createPost({ slug: "systems/alpha", title: "Alpha" }),
    ];

    const categories = getBlogCategories(posts);
    expect(categories.map((category) => category.slug)).toEqual([
      "about",
      "systems",
    ]);
    expect(categories[1].items.map((item) => item.href)).toEqual([
      "/systems/alpha",
      "/systems/zeta",
    ]);
  });

  it("builds search text from markdown content", () => {
    const posts = [
      createPost({
        slug: "frontend/hooks",
        title: "Hooks",
        description: "React hooks article",
        category: "Frontend",
        markdown:
          "## Heading\nSome `inline` code and a [link](https://example.com).",
      }),
    ];

    const links = getBlogLinks(posts);
    expect(links[0].searchText).toContain("Some");
    expect(links[0].searchText).not.toContain("[link]");
    expect(links[0].searchText).not.toContain("`inline`");
  });
});
