import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { blogFileToObsidianDraft } from "../src/lib/sync/blog-to-obsidian";
import {
  pushVengeanceToObsidian,
  pullBlogByTarget,
} from "../src/lib/sync/push-to-obsidian";
import type { SyncConfig, SyncManifest } from "../src/lib/sync/types";

const tempDirs: string[] = [];

function makeTempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vengeance-sync-pull-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("blog to obsidian", () => {
  it("strips vengeance metadata from obsidian output", () => {
    const draft = blogFileToObsidianDraft(
      `---
title: Example Post
description: From blog
vengeance:
  syncId: abc
  obsidianPath: Blog/Drafts/example-post.md
  source: obsidian
---

## Intro
Updated in blog`,
      "content/blog/frontend/example-post.md",
      "frontend/example-post",
      "Blog/Drafts/example-post.md",
      "abc",
      [],
      "https://vengeance-blog-template.vercel.app",
    );

    expect(draft.markdown).toContain("title: Example Post");
    expect(draft.markdown).not.toContain("vengeance:");
    expect(draft.markdown).toContain("## Intro");
  });

  it("writes blog changes into the obsidian vault", () => {
    const root = makeTempRoot();
    const vault = path.join(root, "vault");
    const blogDir = path.join(root, "content", "blog", "frontend");
    fs.mkdirSync(blogDir, { recursive: true });

    const blogPath = path.join(blogDir, "example-post.md");
    fs.writeFileSync(
      blogPath,
      `---
title: Example Post
description: From blog
vengeance:
  syncId: sync-1
  obsidianPath: Blog/Drafts/example-post.md
  source: obsidian
---

## Intro
Updated in blog`,
      "utf8",
    );

    const config: SyncConfig = {
      vaultPath: vault,
      mappings: [
        {
          obsidianFolder: "Blog/Drafts",
          blogCategory: "frontend",
          direction: "bidirectional",
        },
      ],
      obsidianPublishFolder: "Blog/Drafts",
      obsidianBlogRoot: "Blogs",
      ignore: [".obsidian"],
      syncFrontmatter: true,
      wikilinkMode: "markdown",
    };

    const manifest: SyncManifest = {
      version: 1,
      entries: [
        {
          id: "sync-1",
          obsidianPath: "Blog/Drafts/example-post.md",
          blogPath: "content/blog/frontend/example-post.md",
          blogSlug: "frontend/example-post",
          contentHash: "old-hash",
          lastSyncedAt: null,
          lastSource: "obsidian",
        },
      ],
    };

    const result = pushVengeanceToObsidian(root, config, manifest);

    expect(result.created).toEqual(["Blog/Drafts/example-post.md"]);
    expect(
      fs.existsSync(path.join(vault, "Blog", "Drafts", "example-post.md")),
    ).toBe(true);

    const obsidianNote = fs.readFileSync(
      path.join(vault, "Blog", "Drafts", "example-post.md"),
      "utf8",
    );
    expect(obsidianNote).toContain("Updated in blog");
    expect(obsidianNote).not.toContain("vengeance:");
    expect(manifest.entries[0].lastSource).toBe("vengeance");
  });

  it("pulls all blog posts from content/blog into Obsidian", () => {
    const root = makeTempRoot();
    const vault = path.join(root, "vault");

    for (const [category, slug] of [
      ["frontend", "post-a"],
      ["classics", "post-b"],
    ] as const) {
      const blogDir = path.join(root, "content", "blog", category);
      fs.mkdirSync(blogDir, { recursive: true });
      fs.writeFileSync(
        path.join(blogDir, `${slug}.md`),
        `---
title: ${slug}
---

Body for ${slug}`,
        "utf8",
      );
    }

    const config: SyncConfig = {
      vaultPath: vault,
      mappings: [],
      obsidianPublishFolder: "Blogs/Drafts",
      obsidianBlogRoot: "Blogs",
      ignore: [".obsidian"],
      syncFrontmatter: true,
      wikilinkMode: "markdown",
    };

    const manifest = { version: 1 as const, entries: [] };
    const result = pushVengeanceToObsidian(root, config, manifest);

    expect(result.created).toEqual([
      "Blogs/classics/post-b.md",
      "Blogs/frontend/post-a.md",
    ]);
    expect(manifest.entries).toHaveLength(2);
  });

  it("converts internal blog links to wikilinks on pull", () => {
    const root = makeTempRoot();
    const vault = path.join(root, "vault");
    const frontendDir = path.join(root, "content", "blog", "frontend");
    const systemsDir = path.join(root, "content", "blog", "systems");
    fs.mkdirSync(frontendDir, { recursive: true });
    fs.mkdirSync(systemsDir, { recursive: true });

    fs.writeFileSync(
      path.join(frontendDir, "how-browsers-work.md"),
      `---
title: How Browsers Work
---

See [Why Redis Is Fast](/systems/why-redis-is-fast).`,
      "utf8",
    );
    fs.writeFileSync(
      path.join(systemsDir, "why-redis-is-fast.md"),
      `---
title: Why Redis Is Fast
---

Body`,
      "utf8",
    );

    const config: SyncConfig = {
      vaultPath: vault,
      mappings: [],
      obsidianPublishFolder: "Blogs/Drafts",
      obsidianBlogRoot: "Blogs",
      ignore: [".obsidian"],
      syncFrontmatter: true,
      wikilinkMode: "markdown",
    };

    process.env.NEXT_PUBLIC_SITE_URL = "https://blog.test";
    const manifest = { version: 1 as const, entries: [] };
    pullBlogByTarget(root, config, manifest, "frontend/how-browsers-work.md");

    const obsidianNote = fs.readFileSync(
      path.join(vault, "Blogs", "frontend", "how-browsers-work.md"),
      "utf8",
    );
    expect(obsidianNote).toContain("[[why-redis-is-fast]]");
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("keeps blog markdown links when pulling to obsidian", () => {
    const root = makeTempRoot();
    const vault = path.join(root, "vault");
    const blogDir = path.join(root, "content", "blog", "frontend");
    fs.mkdirSync(blogDir, { recursive: true });

    const blogSource = `---
title: How Browsers Work
---

See [Why Redis Is Fast](/systems/why-redis-is-fast).`;

    fs.writeFileSync(
      path.join(blogDir, "how-browsers-work.md"),
      blogSource,
      "utf8",
    );
    fs.mkdirSync(path.join(root, "content", "blog", "systems"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, "content", "blog", "systems", "why-redis-is-fast.md"),
      "---\ntitle: Why Redis Is Fast\n---\n\nBody",
      "utf8",
    );

    const config: SyncConfig = {
      vaultPath: vault,
      mappings: [],
      obsidianPublishFolder: "Blogs/Drafts",
      obsidianBlogRoot: "Blogs",
      ignore: [".obsidian"],
      syncFrontmatter: true,
      wikilinkMode: "markdown",
    };

    process.env.NEXT_PUBLIC_SITE_URL = "https://blog.test";
    const manifest = { version: 1 as const, entries: [] };
    pullBlogByTarget(root, config, manifest, "frontend/how-browsers-work.md");

    const blogAfter = fs.readFileSync(
      path.join(blogDir, "how-browsers-work.md"),
      "utf8",
    );
    expect(blogAfter).toContain(
      "[Why Redis Is Fast](/systems/why-redis-is-fast)",
    );
    expect(blogAfter).not.toContain("[[why-redis-is-fast]]");

    const obsidianNote = fs.readFileSync(
      path.join(vault, "Blogs", "frontend", "how-browsers-work.md"),
      "utf8",
    );
    expect(obsidianNote).toContain("[[why-redis-is-fast]]");
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("does not write sync frontmatter back into the blog repo on pull", () => {
    const root = makeTempRoot();
    const vault = path.join(root, "vault");
    const blogDir = path.join(root, "content", "blog", "frontend");
    fs.mkdirSync(blogDir, { recursive: true });

    const blogSource = `---
title: How Browsers Work
---

Body`;

    fs.writeFileSync(
      path.join(blogDir, "how-browsers-work.md"),
      blogSource,
      "utf8",
    );

    const config: SyncConfig = {
      vaultPath: vault,
      mappings: [],
      obsidianPublishFolder: "Blogs/Drafts",
      obsidianBlogRoot: "Blogs",
      ignore: [".obsidian"],
      syncFrontmatter: true,
      wikilinkMode: "markdown",
    };

    const manifest = { version: 1 as const, entries: [] };
    pullBlogByTarget(root, config, manifest, "frontend/how-browsers-work.md");

    const blogAfter = fs.readFileSync(
      path.join(blogDir, "how-browsers-work.md"),
      "utf8",
    );
    expect(blogAfter).toBe(blogSource);
    expect(blogAfter).not.toContain("vengeance:");
  });

  it("pulls one vengeance blog into Blogs/category/file.md", () => {
    const root = makeTempRoot();
    const vault = path.join(root, "vault");
    const blogDir = path.join(root, "content", "blog", "frontend");
    fs.mkdirSync(blogDir, { recursive: true });

    fs.writeFileSync(
      path.join(blogDir, "how-browsers-work.md"),
      `---
title: How Browsers Work
description: A classic post
---

## Intro
Browser internals`,
      "utf8",
    );

    const config: SyncConfig = {
      vaultPath: vault,
      mappings: [
        {
          obsidianFolder: "Blogs/Drafts",
          blogCategory: "frontend",
          direction: "bidirectional",
        },
      ],
      obsidianPublishFolder: "Blogs/Drafts",
      obsidianBlogRoot: "Blogs",
      ignore: [".obsidian"],
      syncFrontmatter: true,
      wikilinkMode: "markdown",
    };

    const manifest = { version: 1 as const, entries: [] };
    const result = pullBlogByTarget(
      root,
      config,
      manifest,
      "frontend/how-browsers-work.md",
    );

    expect(result.created).toEqual(["Blogs/frontend/how-browsers-work.md"]);
    expect(
      fs.existsSync(
        path.join(vault, "Blogs", "frontend", "how-browsers-work.md"),
      ),
    ).toBe(true);
  });
});
