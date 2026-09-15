import matter from "gray-matter";
import { convertBlogLinksToWikilinks } from "./link-conversion";
import type { BlogLinkIndexEntry } from "./link-index";
import type { VengeanceFrontmatterSync } from "./types";

type BlogFrontmatter = {
  title?: string;
  description?: string;
  author?: string;
  date?: string;
  inspiredBy?: string;
  tags?: string[];
  thumbnail?: string;
  vengeance?: VengeanceFrontmatterSync;
};

export type ObsidianDraftFromBlog = {
  obsidianPath: string;
  markdown: string;
  syncMeta: {
    blogPath: string;
    blogSlug: string;
    source: "vengeance";
    lastSyncedAt: string;
    syncId: string;
  };
};

function cleanFrontmatter(data: BlogFrontmatter) {
  const frontmatter: Record<string, unknown> = {};

  if (data.title) frontmatter.title = data.title;
  if (data.description) frontmatter.description = data.description;
  if (data.author) frontmatter.author = data.author;
  if (data.date) frontmatter.date = data.date;
  if (data.inspiredBy) frontmatter.inspiredBy = data.inspiredBy;
  if (data.tags?.length) frontmatter.tags = data.tags;
  if (data.thumbnail) frontmatter.thumbnail = data.thumbnail;

  return frontmatter;
}

export function blogFileToObsidianDraft(
  source: string,
  blogPath: string,
  blogSlug: string,
  obsidianPath: string,
  syncId: string,
  linkIndex: BlogLinkIndexEntry[] = [],
  siteUrl = "http://localhost:3000",
): ObsidianDraftFromBlog {
  const parsed = matter(source);
  const data = parsed.data as BlogFrontmatter;
  const now = new Date().toISOString();
  const frontmatter = cleanFrontmatter(data);
  const body = convertBlogLinksToWikilinks(
    parsed.content.trim(),
    linkIndex,
    siteUrl,
  );

  return {
    obsidianPath,
    markdown: matter.stringify(body ? `\n${body}\n` : "\n", frontmatter),
    syncMeta: {
      blogPath,
      blogSlug,
      source: "vengeance",
      lastSyncedAt: now,
      syncId,
    },
  };
}

export function vengeanceDraftToBlogFileContent(
  draft: ObsidianDraftFromBlog,
  existingSource?: string,
) {
  const parsed = existingSource
    ? matter(existingSource)
    : { data: {}, content: "" };
  const existing = parsed.data as BlogFrontmatter;
  // Pull writes wikilinks only to Obsidian — keep markdown links in the blog repo.
  const body = existingSource
    ? parsed.content.trim()
    : matter(draft.markdown).content.trim();
  const parsedObsidian = matter(draft.markdown).data as BlogFrontmatter;

  const frontmatter: Record<string, unknown> = {
    title: existing.title ?? parsedObsidian.title,
    description: existing.description ?? parsedObsidian.description,
    author: existing.author ?? parsedObsidian.author,
    inspiredBy: existing.inspiredBy ?? parsedObsidian.inspiredBy,
    date: existing.date ?? parsedObsidian.date,
    vengeance: {
      syncId: draft.syncMeta.syncId,
      obsidianPath: draft.obsidianPath,
      lastSyncedAt: draft.syncMeta.lastSyncedAt,
      source: draft.syncMeta.source,
    },
  };

  if (existing.tags?.length || parsedObsidian.tags?.length) {
    frontmatter.tags = existing.tags ?? parsedObsidian.tags;
  }
  if (existing.thumbnail || parsedObsidian.thumbnail) {
    frontmatter.thumbnail = existing.thumbnail ?? parsedObsidian.thumbnail;
  }

  for (const key of Object.keys(frontmatter)) {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  }

  return matter.stringify(body ? `\n${body}\n` : "\n", frontmatter);
}
