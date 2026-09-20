export type SyncDirection =
  "bidirectional" | "obsidian-to-vengeance" | "vengeance-to-obsidian";

export type WikilinkMode = "markdown" | "plain";

export type SyncSource = "obsidian" | "vengeance";

export type FolderMapping = {
  obsidianFolder: string;
  blogCategory: string;
  direction: SyncDirection;
};

export type SyncConfig = {
  vaultPath: string;
  mappings: FolderMapping[];
  obsidianPublishFolder: string;
  obsidianBlogRoot: string;
  ignore: string[];
  syncFrontmatter: boolean;
  wikilinkMode: WikilinkMode;
};

export type SyncManifestEntry = {
  id: string;
  obsidianPath: string;
  blogPath: string;
  blogSlug: string;
  contentHash: string;
  lastSyncedAt: string | null;
  lastSource: SyncSource | null;
};

export type SyncManifest = {
  version: 1;
  entries: SyncManifestEntry[];
};

export type VengeanceFrontmatterSync = {
  syncId?: string;
  obsidianPath?: string;
  lastSyncedAt?: string;
  source?: SyncSource;
};
