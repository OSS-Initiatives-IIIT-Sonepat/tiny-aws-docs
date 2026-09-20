import fs from "node:fs";
import path from "node:path";
import type { SyncManifest, SyncManifestEntry } from "./types";
import { getManifestPath } from "./paths";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseManifestEntry(value: unknown, index: number): SyncManifestEntry {
  if (!isObject(value)) {
    throw new Error(`entries[${index}] must be an object`);
  }

  const requiredStrings = [
    "id",
    "obsidianPath",
    "blogPath",
    "blogSlug",
    "contentHash",
  ] as const;

  for (const key of requiredStrings) {
    if (typeof value[key] !== "string") {
      throw new Error(`entries[${index}].${key} must be a string`);
    }
  }

  const lastSyncedAt = value.lastSyncedAt;
  if (lastSyncedAt !== null && typeof lastSyncedAt !== "string") {
    throw new Error(`entries[${index}].lastSyncedAt must be a string or null`);
  }

  const lastSource = value.lastSource;
  if (
    lastSource !== null &&
    lastSource !== "obsidian" &&
    lastSource !== "vengeance"
  ) {
    throw new Error(
      `entries[${index}].lastSource must be 'obsidian', 'vengeance', or null`,
    );
  }

  const id = value.id as string;
  const obsidianPath = value.obsidianPath as string;
  const blogPath = value.blogPath as string;
  const blogSlug = value.blogSlug as string;
  const contentHash = value.contentHash as string;

  return {
    id,
    obsidianPath: obsidianPath.replace(/\\/g, "/"),
    blogPath: blogPath.replace(/\\/g, "/"),
    blogSlug: blogSlug.replace(/\\/g, "/"),
    contentHash,
    lastSyncedAt,
    lastSource,
  };
}

export function validateSyncManifest(value: unknown): SyncManifest {
  if (!isObject(value)) {
    throw new Error("Sync manifest must be a JSON object");
  }

  if (value.version !== 1) {
    throw new Error("Sync manifest version must be 1");
  }

  if (!Array.isArray(value.entries)) {
    throw new Error("Sync manifest entries must be an array");
  }

  return {
    version: 1,
    entries: value.entries.map(parseManifestEntry),
  };
}

export function createEmptyManifest(): SyncManifest {
  return { version: 1, entries: [] };
}

export function loadSyncManifest(rootDir: string): SyncManifest {
  const manifestPath = getManifestPath(rootDir);

  if (!fs.existsSync(manifestPath)) {
    return createEmptyManifest();
  }

  const raw = fs.readFileSync(manifestPath, "utf8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in sync manifest: ${manifestPath}`);
  }

  return validateSyncManifest(parsed);
}

export function saveSyncManifest(rootDir: string, manifest: SyncManifest) {
  const manifestPath = getManifestPath(rootDir);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

export function findManifestEntryByObsidianPath(
  manifest: SyncManifest,
  obsidianPath: string,
) {
  const normalized = obsidianPath.replace(/\\/g, "/");
  return manifest.entries.find((entry) => entry.obsidianPath === normalized);
}

export function findManifestEntryByBlogPath(
  manifest: SyncManifest,
  blogPath: string,
) {
  const normalized = blogPath.replace(/\\/g, "/");
  return manifest.entries.find((entry) => entry.blogPath === normalized);
}

export function findManifestEntryByBlogSlug(
  manifest: SyncManifest,
  blogSlug: string,
) {
  const normalized = blogSlug.replace(/\\/g, "/");
  return manifest.entries.find((entry) => entry.blogSlug === normalized);
}
