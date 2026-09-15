import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { FolderMapping, SyncConfig, SyncManifest } from "./types";
import { loadSyncConfig } from "./config";
import { getBlogSyncSummary } from "./push-to-obsidian";
import {
  findManifestEntryByBlogSlug,
  findManifestEntryByObsidianPath,
  loadSyncManifest,
  saveSyncManifest,
} from "./manifest";
import {
  obsidianDraftToBlogFileContent,
  obsidianNoteToBlogDraft,
} from "./obsidian-to-blog";
import { hashContent } from "./hash";
import type { BlogLinkIndexEntry } from "./link-index";
import { buildBlogLinkIndex } from "./link-index";
import { loadEnvFiles } from "./load-env";
import { slugifyFileName } from "./parse-obsidian";
import {
  buildObsidianPathForBlog,
  resolveBlogTarget,
} from "./resolve-blog-target";

const BLOG_ROOT = path.join("content", "blog");

export type PushResult = {
  created: string[];
  updated: string[];
  skipped: string[];
};

function mappingAllowsObsidianPush(mapping: FolderMapping) {
  return (
    mapping.direction === "bidirectional" ||
    mapping.direction === "obsidian-to-vengeance"
  );
}

function mappingForBlogCategory(config: SyncConfig, blogCategory: string) {
  return config.mappings.find(
    (mapping) =>
      mapping.blogCategory === blogCategory &&
      mappingAllowsObsidianPush(mapping),
  );
}

function mappingForObsidianPath(config: SyncConfig, obsidianPath: string) {
  return config.mappings.find((mapping) => {
    if (!mappingAllowsObsidianPush(mapping)) return false;
    return (
      obsidianPath === mapping.obsidianFolder ||
      obsidianPath.startsWith(`${mapping.obsidianFolder}/`)
    );
  });
}

function shouldIgnore(relativePath: string, ignore: string[]) {
  const parts = relativePath.split("/");
  return ignore.some((pattern) => parts.includes(pattern));
}

function collectObsidianNotes(vaultPath: string, obsidianFolder: string) {
  const folderAbs = path.join(vaultPath, obsidianFolder);
  if (!fs.existsSync(folderAbs)) {
    return [] as string[];
  }

  const files: string[] = [];
  const stack = [folderAbs];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(abs);
      }
    }
  }

  return files.sort();
}

function toObsidianRelative(vaultPath: string, absPath: string) {
  return path.relative(vaultPath, absPath).replace(/\\/g, "/");
}

function normalizeObsidianTargetInput(input: string) {
  return input
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

function syncOneObsidianNote(
  rootDir: string,
  config: SyncConfig,
  manifest: SyncManifest,
  absNotePath: string,
  mapping: FolderMapping,
  result: PushResult,
  linkIndex: BlogLinkIndexEntry[],
  options: { force?: boolean } = {},
) {
  const obsidianPath = toObsidianRelative(config.vaultPath, absNotePath);
  if (shouldIgnore(obsidianPath, config.ignore)) {
    result.skipped.push(`${obsidianPath} (ignored)`);
    return;
  }

  const source = fs.readFileSync(absNotePath, "utf8");
  const draft = obsidianNoteToBlogDraft(
    source,
    obsidianPath,
    config,
    linkIndex,
  );
  const contentHash = hashContent(draft.markdown);
  const fileBase = path.basename(absNotePath, ".md");
  const slug = slugifyFileName(fileBase) || "untitled";
  const blogRelPath = path
    .join(BLOG_ROOT, mapping.blogCategory, `${slug}.md`)
    .replace(/\\/g, "/");
  const blogAbsPath = path.join(rootDir, blogRelPath);
  const blogSlug = `${mapping.blogCategory}/${slug}`;

  const existing = findManifestEntryByObsidianPath(manifest, obsidianPath);
  if (
    !options.force &&
    existing &&
    existing.contentHash === contentHash &&
    fs.existsSync(blogAbsPath)
  ) {
    result.skipped.push(
      `${obsidianPath} (already in sync — edit the Obsidian note, then push again)`,
    );
    return;
  }

  const syncId = existing?.id ?? randomUUID();
  const fileContent = obsidianDraftToBlogFileContent(draft, syncId);

  fs.mkdirSync(path.dirname(blogAbsPath), { recursive: true });
  const isNewBlogFile = !fs.existsSync(blogAbsPath);
  fs.writeFileSync(blogAbsPath, fileContent, "utf8");

  const entry = {
    id: syncId,
    obsidianPath,
    blogPath: blogRelPath,
    blogSlug,
    contentHash,
    lastSyncedAt: draft.syncMeta.lastSyncedAt,
    lastSource: "obsidian" as const,
  };

  if (existing) {
    manifest.entries = manifest.entries.map((item) =>
      item.id === existing.id ? entry : item,
    );
    result.updated.push(blogRelPath);
  } else {
    manifest.entries.push(entry);
    result[isNewBlogFile ? "created" : "updated"].push(blogRelPath);
  }
}

export function pushObsidianNoteByPath(
  rootDir: string,
  config: SyncConfig,
  manifest: SyncManifest,
  obsidianTargetInput: string,
): PushResult {
  const obsidianPath = normalizeObsidianTargetInput(obsidianTargetInput);
  const absNotePath = path.join(config.vaultPath, obsidianPath);

  if (!fs.existsSync(absNotePath)) {
    throw new Error(`Obsidian note not found: ${obsidianPath}`);
  }

  const mapping = mappingForObsidianPath(config, obsidianPath);
  if (!mapping) {
    throw new Error(
      `No sync mapping configured for Obsidian path: ${obsidianPath}`,
    );
  }

  const result: PushResult = { created: [], updated: [], skipped: [] };
  const linkIndex = buildBlogLinkIndex(rootDir);
  syncOneObsidianNote(
    rootDir,
    config,
    manifest,
    absNotePath,
    mapping,
    result,
    linkIndex,
    { force: true },
  );
  saveSyncManifest(rootDir, manifest);
  return result;
}

export function pushObsidianByBlogTarget(
  rootDir: string,
  config: SyncConfig,
  manifest: SyncManifest,
  blogTargetInput: string,
): PushResult {
  const target = resolveBlogTarget(rootDir, blogTargetInput);
  const manifestEntry = findManifestEntryByBlogSlug(manifest, target.blogSlug);
  const obsidianPath =
    manifestEntry?.obsidianPath ??
    buildObsidianPathForBlog(config.obsidianBlogRoot, target.blogSlug);
  const absNotePath = path.join(config.vaultPath, obsidianPath);

  if (!fs.existsSync(absNotePath)) {
    throw new Error(
      `No Obsidian note found for ${target.blogSlug}. Expected: ${obsidianPath}`,
    );
  }

  const mapping = mappingForBlogCategory(config, target.category);
  if (!mapping) {
    throw new Error(
      `No sync mapping configured for blog category: ${target.category}`,
    );
  }

  const result: PushResult = { created: [], updated: [], skipped: [] };
  const linkIndex = buildBlogLinkIndex(rootDir);
  syncOneObsidianNote(
    rootDir,
    config,
    manifest,
    absNotePath,
    mapping,
    result,
    linkIndex,
    { force: true },
  );
  saveSyncManifest(rootDir, manifest);
  return result;
}

export function pushObsidianToVengeance(
  rootDir: string,
  config: SyncConfig,
  manifest: SyncManifest,
): PushResult {
  const result: PushResult = { created: [], updated: [], skipped: [] };
  const linkIndex = buildBlogLinkIndex(rootDir);

  for (const mapping of config.mappings) {
    if (!mappingAllowsObsidianPush(mapping)) continue;

    const notes = collectObsidianNotes(
      config.vaultPath,
      mapping.obsidianFolder,
    );
    if (notes.length === 0) {
      result.skipped.push(
        `No notes found in ${mapping.obsidianFolder} (create this folder in your vault)`,
      );
      continue;
    }

    for (const absNotePath of notes) {
      syncOneObsidianNote(
        rootDir,
        config,
        manifest,
        absNotePath,
        mapping,
        result,
        linkIndex,
      );
    }
  }

  saveSyncManifest(rootDir, manifest);
  return result;
}

export function runPushToVengeance(rootDir: string, target?: string) {
  loadEnvFiles(rootDir);
  const config = loadSyncConfig(rootDir);
  const manifest = loadSyncManifest(rootDir);

  if (!target?.trim()) {
    return pushObsidianToVengeance(rootDir, config, manifest);
  }

  const normalized = target.trim().replace(/\\/g, "/");
  const obsidianAbs = path.join(config.vaultPath, normalized);

  if (fs.existsSync(obsidianAbs)) {
    return pushObsidianNoteByPath(rootDir, config, manifest, normalized);
  }

  return pushObsidianByBlogTarget(rootDir, config, manifest, normalized);
}

export function getSyncStatus(rootDir: string) {
  const config = loadSyncConfig(rootDir);
  const manifest = loadSyncManifest(rootDir);

  const pendingFolders = config.mappings.map((mapping) => {
    const folderAbs = path.join(config.vaultPath, mapping.obsidianFolder);
    const exists = fs.existsSync(folderAbs);
    const noteCount = exists
      ? collectObsidianNotes(config.vaultPath, mapping.obsidianFolder).length
      : 0;
    return {
      obsidianFolder: mapping.obsidianFolder,
      blogCategory: mapping.blogCategory,
      folderExists: exists,
      noteCount,
    };
  });

  return {
    vaultPath: config.vaultPath,
    linkedEntries: manifest.entries.length,
    folders: pendingFolders,
    blogs: getBlogSyncSummary(rootDir),
  };
}
