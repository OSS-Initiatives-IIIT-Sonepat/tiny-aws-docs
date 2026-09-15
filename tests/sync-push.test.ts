import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { convertWikilinks } from "../src/lib/sync/parse-obsidian";
import {
  obsidianDraftToBlogFileContent,
  obsidianNoteToBlogDraft,
} from "../src/lib/sync/obsidian-to-blog";
import { pushObsidianToVengeance } from "../src/lib/sync/push-to-vengeance";
import type { SyncConfig } from "../src/lib/sync/types";
import { createEmptyManifest } from "../src/lib/sync/manifest";

const tempDirs: string[] = [];

function makeTempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vengeance-sync-push-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("obsidian parsing", () => {
  it("converts wikilinks to markdown links", () => {
    const linkIndex = [
      {
        blogSlug: "frontend/create-a-link",
        href: "/frontend/create-a-link",
        title: "Create A Link",
        fileStem: "create-a-link",
      },
    ];

    expect(
      convertWikilinks("Try [[create a link]]", "markdown", linkIndex),
    ).toBe("Try [Create A Link](/frontend/create-a-link)");
  });

  it("builds blog draft from obsidian note", () => {
    const draft = obsidianNoteToBlogDraft(
      "---\ntitle: Hello\n---\n\n## Intro\nBody",
      "Blog/Drafts/hello.md",
      {
        vaultPath: "/path/to/ObsidianVault",
        mappings: [],
        obsidianPublishFolder: "Blog/Drafts",
        obsidianBlogRoot: "Blogs",
        ignore: [],
        syncFrontmatter: true,
        wikilinkMode: "markdown",
      },
    );

    expect(draft.title).toBe("Hello");
    expect(draft.markdown).toContain("## Intro");
  });
});

describe("push obsidian to vengeance", () => {
  it("writes blog files and updates manifest", () => {
    const root = makeTempRoot();
    const vault = path.join(root, "vault");
    const noteDir = path.join(vault, "Blog", "Drafts");
    fs.mkdirSync(noteDir, { recursive: true });
    fs.mkdirSync(path.join(root, ".vengeance"), { recursive: true });

    fs.writeFileSync(
      path.join(noteDir, "example-post.md"),
      "---\ntitle: Example Post\ndescription: From Obsidian\n---\n\n## Intro\nHello",
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

    const manifest = createEmptyManifest();
    const result = pushObsidianToVengeance(root, config, manifest);

    expect(result.created).toEqual(["content/blog/frontend/example-post.md"]);
    expect(
      fs.existsSync(path.join(root, "content/blog/frontend/example-post.md")),
    ).toBe(true);

    const output = fs.readFileSync(
      path.join(root, "content/blog/frontend/example-post.md"),
      "utf8",
    );
    expect(output).toContain("title: Example Post");
    expect(output).toContain("obsidianPath: Blog/Drafts/example-post.md");
    expect(manifest.entries).toHaveLength(1);
  });

  it("serializes sync metadata into blog frontmatter", () => {
    const draft = obsidianNoteToBlogDraft(
      "# Title\n\nBody",
      "Blog/Drafts/test.md",
      {
        vaultPath: "/path/to/ObsidianVault",
        mappings: [],
        obsidianPublishFolder: "Blog/Drafts",
        obsidianBlogRoot: "Blogs",
        ignore: [],
        syncFrontmatter: true,
        wikilinkMode: "markdown",
      },
    );

    const serialized = obsidianDraftToBlogFileContent(draft, "sync-id-1");
    expect(serialized).toContain("syncId: sync-id-1");
    expect(serialized).toContain("source: obsidian");
  });
});
