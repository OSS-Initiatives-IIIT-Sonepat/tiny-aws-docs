import type {
  FolderMapping,
  SyncConfig,
  SyncDirection,
  WikilinkMode,
} from "./types";

const SYNC_DIRECTIONS = new Set<SyncDirection>([
  "bidirectional",
  "obsidian-to-vengeance",
  "vengeance-to-obsidian",
]);

const WIKILINK_MODES = new Set<WikilinkMode>(["markdown", "plain"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMapping(value: unknown, index: number): FolderMapping {
  if (!isObject(value)) {
    throw new Error(`mappings[${index}] must be an object`);
  }

  const obsidianFolder = value.obsidianFolder;
  const blogCategory = value.blogCategory;
  const direction = value.direction ?? "bidirectional";

  if (typeof obsidianFolder !== "string" || !obsidianFolder.trim()) {
    throw new Error(
      `mappings[${index}].obsidianFolder must be a non-empty string`,
    );
  }

  if (typeof blogCategory !== "string" || !blogCategory.trim()) {
    throw new Error(
      `mappings[${index}].blogCategory must be a non-empty string`,
    );
  }

  if (
    typeof direction !== "string" ||
    !SYNC_DIRECTIONS.has(direction as SyncDirection)
  ) {
    throw new Error(
      `mappings[${index}].direction must be one of: ${[...SYNC_DIRECTIONS].join(", ")}`,
    );
  }

  return {
    obsidianFolder: obsidianFolder
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, ""),
    blogCategory: blogCategory.replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""),
    direction: direction as SyncDirection,
  };
}

export function validateSyncConfig(value: unknown): SyncConfig {
  if (!isObject(value)) {
    throw new Error("Sync config must be a JSON object");
  }

  const vaultPath = value.vaultPath;
  if (typeof vaultPath !== "string" || !vaultPath.trim()) {
    throw new Error("vaultPath must be a non-empty string");
  }

  if (!Array.isArray(value.mappings) || value.mappings.length === 0) {
    throw new Error("mappings must be a non-empty array");
  }

  const mappings = value.mappings.map(parseMapping);

  const obsidianPublishFolder = value.obsidianPublishFolder;
  if (
    typeof obsidianPublishFolder !== "string" ||
    !obsidianPublishFolder.trim()
  ) {
    throw new Error("obsidianPublishFolder must be a non-empty string");
  }

  const ignore = value.ignore;
  if (
    ignore !== undefined &&
    (!Array.isArray(ignore) || ignore.some((item) => typeof item !== "string"))
  ) {
    throw new Error("ignore must be an array of strings when provided");
  }

  const syncFrontmatter = value.syncFrontmatter;
  if (syncFrontmatter !== undefined && typeof syncFrontmatter !== "boolean") {
    throw new Error("syncFrontmatter must be a boolean when provided");
  }

  const wikilinkMode = value.wikilinkMode ?? "markdown";
  if (
    typeof wikilinkMode !== "string" ||
    !WIKILINK_MODES.has(wikilinkMode as WikilinkMode)
  ) {
    throw new Error("wikilinkMode must be 'markdown' or 'plain'");
  }

  const obsidianBlogRoot = value.obsidianBlogRoot ?? "Blogs";
  if (typeof obsidianBlogRoot !== "string" || !obsidianBlogRoot.trim()) {
    throw new Error(
      "obsidianBlogRoot must be a non-empty string when provided",
    );
  }

  return {
    vaultPath: pathNormalize(vaultPath),
    mappings,
    obsidianPublishFolder: obsidianPublishFolder
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, ""),
    obsidianBlogRoot: obsidianBlogRoot
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, ""),
    ignore: ignore ?? [".obsidian", "Templates", "Daily"],
    syncFrontmatter: syncFrontmatter ?? true,
    wikilinkMode: wikilinkMode as WikilinkMode,
  };
}

function pathNormalize(value: string) {
  return value.replace(/\\/g, "/").replace(/\/+$/g, "");
}

// Lazy import path only where needed for validate - actually we used pathNormalize inline
// Remove unused path import - I didn't import path in config.ts, good.

export const DEFAULT_SYNC_CONFIG: Omit<SyncConfig, "vaultPath"> = {
  mappings: [
    {
      obsidianFolder: "Blog/Drafts",
      blogCategory: "frontend",
      direction: "bidirectional",
    },
  ],
  obsidianPublishFolder: "Blog/Drafts",
  obsidianBlogRoot: "Blogs",
  ignore: [".obsidian", "Templates", "Daily"],
  syncFrontmatter: true,
  wikilinkMode: "markdown",
};
