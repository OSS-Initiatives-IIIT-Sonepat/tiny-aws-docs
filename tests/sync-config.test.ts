import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadSyncConfig, writeSyncConfig } from "../src/lib/sync/config";
import {
  createEmptyManifest,
  loadSyncManifest,
  saveSyncManifest,
} from "../src/lib/sync/manifest";
import { validateSyncConfig } from "../src/lib/sync/validate-config";

const tempDirs: string[] = [];

function makeTempRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vengeance-sync-"));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, ".vengeance"), { recursive: true });
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("sync config", () => {
  it("validates a well-formed config", () => {
    const config = validateSyncConfig({
      vaultPath: "/path/to/ObsidianVault",
      mappings: [
        {
          obsidianFolder: "Blog/Drafts",
          blogCategory: "frontend",
          direction: "bidirectional",
        },
      ],
      obsidianPublishFolder: "Blog/Drafts",
      obsidianBlogRoot: "Blogs",
    });

    expect(config.vaultPath).toBe("/path/to/ObsidianVault");
    expect(config.mappings[0].blogCategory).toBe("frontend");
  });

  it("loads config when vault path exists", () => {
    const root = makeTempRoot();
    const vaultPath = path.join(root, "vault");
    fs.mkdirSync(vaultPath, { recursive: true });

    writeSyncConfig(root, {
      vaultPath,
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
    });

    const loaded = loadSyncConfig(root);
    expect(loaded.vaultPath).toBe(vaultPath.replace(/\\/g, "/"));
  });

  it("rejects config when vault path is missing", () => {
    const root = makeTempRoot();

    writeSyncConfig(root, {
      vaultPath: path.join(root, "missing-vault"),
      mappings: [
        {
          obsidianFolder: "Blog/Drafts",
          blogCategory: "frontend",
          direction: "bidirectional",
        },
      ],
      obsidianPublishFolder: "Blog/Drafts",
      obsidianBlogRoot: "Blogs",
      ignore: [],
      syncFrontmatter: true,
      wikilinkMode: "markdown",
    });

    expect(() => loadSyncConfig(root)).toThrow(/vault not found/i);
  });
});

describe("sync manifest", () => {
  it("returns an empty manifest when file is missing", () => {
    const root = makeTempRoot();
    expect(loadSyncManifest(root)).toEqual(createEmptyManifest());
  });

  it("persists and reloads manifest entries", () => {
    const root = makeTempRoot();
    const manifest = {
      version: 1 as const,
      entries: [
        {
          id: "test-id",
          obsidianPath: "Blog/Drafts/example.md",
          blogPath: "content/blog/frontend/example.md",
          blogSlug: "frontend/example",
          contentHash: "abc123",
          lastSyncedAt: "2026-08-25T18:00:00.000Z",
          lastSource: "obsidian" as const,
        },
      ],
    };

    saveSyncManifest(root, manifest);
    expect(loadSyncManifest(root)).toEqual(manifest);
  });
});
