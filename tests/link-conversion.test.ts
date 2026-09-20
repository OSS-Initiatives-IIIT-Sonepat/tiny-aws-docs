import { describe, expect, it } from "vitest";
import {
  convertBlogLinksToWikilinks,
  convertWikilinksToBlogLinks,
} from "../src/lib/sync/link-conversion";
import type { BlogLinkIndexEntry } from "../src/lib/sync/link-index";
import {
  buildBlogLinkIndex,
  resolveBlogHref,
  resolveWikilinkTarget,
} from "../src/lib/sync/link-index";

const index: BlogLinkIndexEntry[] = [
  {
    blogSlug: "frontend/how-browsers-work",
    href: "/frontend/how-browsers-work",
    title: "How Browsers Work",
    fileStem: "how-browsers-work",
  },
  {
    blogSlug: "systems/why-redis-is-fast",
    href: "/systems/why-redis-is-fast",
    title: "Why Redis Is Fast",
    fileStem: "why-redis-is-fast",
  },
  {
    blogSlug: "classics/cap-theorem-in-practice",
    href: "/classics/cap-theorem-in-practice",
    title: "CAP Theorem in Practice",
    fileStem: "cap-theorem-in-practice",
  },
];

describe("link index resolution", () => {
  it("resolves wikilinks by file stem", () => {
    expect(resolveWikilinkTarget("how-browsers-work", index)?.href).toBe(
      "/frontend/how-browsers-work",
    );
  });

  it("resolves wikilinks by note title", () => {
    expect(resolveWikilinkTarget("How Browsers Work", index)?.href).toBe(
      "/frontend/how-browsers-work",
    );
  });

  it("resolves blog hrefs with site url", () => {
    expect(
      resolveBlogHref(
        "https://vengeance-blog-template.vercel.app/systems/why-redis-is-fast",
        index,
        "https://vengeance-blog-template.vercel.app",
      )?.fileStem,
    ).toBe("why-redis-is-fast");
  });

  it("ignores external links", () => {
    expect(
      resolveBlogHref("https://example.com/page", index, "https://site.test"),
    ).toBeUndefined();
  });
});

describe("obsidian to blog links", () => {
  it("converts resolved wikilinks to blog routes", () => {
    expect(
      convertWikilinksToBlogLinks(
        "See [[how-browsers-work]] next.",
        index,
        "markdown",
      ),
    ).toBe("See [How Browsers Work](/frontend/how-browsers-work) next.");
  });

  it("preserves custom wikilink labels", () => {
    expect(
      convertWikilinksToBlogLinks(
        "Read [[how-browsers-work|browser internals]].",
        index,
        "markdown",
      ),
    ).toBe("Read [browser internals](/frontend/how-browsers-work).");
  });

  it("leaves fenced code untouched", () => {
    const input = "```md\n[[how-browsers-work]]\n```";
    expect(convertWikilinksToBlogLinks(input, index, "markdown")).toBe(input);
  });
});

describe("blog to obsidian links", () => {
  it("converts relative blog links to wikilinks", () => {
    expect(
      convertBlogLinksToWikilinks(
        "Related: [Why Redis Is Fast](/systems/why-redis-is-fast).",
        index,
        "https://vengeance-blog-template.vercel.app",
      ),
    ).toBe("Related: [[why-redis-is-fast]].");
  });

  it("converts absolute blog links using NEXT_PUBLIC_SITE_URL", () => {
    expect(
      convertBlogLinksToWikilinks(
        "See [CAP Theorem in Practice](https://vengeance-blog-template.vercel.app/classics/cap-theorem-in-practice).",
        index,
        "https://vengeance-blog-template.vercel.app",
      ),
    ).toBe("See [[cap-theorem-in-practice]].");
  });

  it("keeps custom labels in wikilinks", () => {
    expect(
      convertBlogLinksToWikilinks(
        "Start with [browser internals](/frontend/how-browsers-work).",
        index,
        "https://vengeance-blog-template.vercel.app",
      ),
    ).toBe("Start with [[how-browsers-work|browser internals]].");
  });

  it("builds an index from blog files", () => {
    const built = buildBlogLinkIndex(process.cwd());
    expect(
      built.some((entry) => entry.blogSlug === "frontend/how-browsers-work"),
    ).toBe(true);
  });
});
