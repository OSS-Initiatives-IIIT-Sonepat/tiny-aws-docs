import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { slugifyFileName } from "./parse-obsidian";

export type BlogLinkIndexEntry = {
  blogSlug: string;
  href: string;
  title: string;
  fileStem: string;
};

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildBlogLinkIndex(rootDir: string): BlogLinkIndexEntry[] {
  const blogRoot = path.join(rootDir, "content", "blog");
  if (!fs.existsSync(blogRoot)) {
    return [];
  }

  const posts: BlogLinkIndexEntry[] = [];

  for (const categoryEntry of fs.readdirSync(blogRoot, {
    withFileTypes: true,
  })) {
    if (!categoryEntry.isDirectory() || categoryEntry.name.startsWith(".")) {
      continue;
    }

    const categoryDir = path.join(blogRoot, categoryEntry.name);
    for (const fileEntry of fs.readdirSync(categoryDir, {
      withFileTypes: true,
    })) {
      if (
        !fileEntry.isFile() ||
        !fileEntry.name.endsWith(".md") ||
        fileEntry.name.startsWith(".")
      ) {
        continue;
      }

      const fileStem = fileEntry.name.replace(/\.md$/i, "");
      const blogSlug = `${categoryEntry.name}/${fileStem}`;
      const absPath = path.join(categoryDir, fileEntry.name);
      const parsed = matter(fs.readFileSync(absPath, "utf8"));
      const title =
        typeof parsed.data.title === "string" && parsed.data.title.trim()
          ? parsed.data.title.trim()
          : titleFromFileName(fileEntry.name);

      posts.push({
        blogSlug,
        href: `/${blogSlug}`,
        title,
        fileStem,
      });
    }
  }

  return posts.sort((a, b) => a.blogSlug.localeCompare(b.blogSlug));
}

export function resolveWikilinkTarget(
  rawTarget: string,
  index: BlogLinkIndexEntry[],
): BlogLinkIndexEntry | undefined {
  const target = rawTarget.trim().replace(/\\/g, "/");
  if (!target) return undefined;

  const normalized = target.replace(/\.md$/i, "");
  const lower = normalized.toLowerCase();

  const bySlug = index.find((entry) => entry.blogSlug.toLowerCase() === lower);
  if (bySlug) return bySlug;

  const byHref = index.find(
    (entry) => entry.href.toLowerCase() === `/${lower}`,
  );
  if (byHref) return byHref;

  const byStem = index.filter(
    (entry) => entry.fileStem.toLowerCase() === lower,
  );
  if (byStem.length === 1) return byStem[0];

  const slugified = slugifyFileName(normalized);
  const bySlugifiedStem = index.filter(
    (entry) => entry.fileStem.toLowerCase() === slugified,
  );
  if (bySlugifiedStem.length === 1) return bySlugifiedStem[0];

  const byTitle = index.filter(
    (entry) => slugifyFileName(entry.title) === slugified,
  );
  if (byTitle.length === 1) return byTitle[0];

  const pathStem = normalized.split("/").pop()?.toLowerCase();
  if (pathStem) {
    const byPathStem = index.filter(
      (entry) => entry.fileStem.toLowerCase() === pathStem,
    );
    if (byPathStem.length === 1) return byPathStem[0];
  }

  return undefined;
}

export function resolveBlogHref(
  href: string,
  index: BlogLinkIndexEntry[],
  siteUrl: string,
): BlogLinkIndexEntry | undefined {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;

  let pathname = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const base = new URL(siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`);
      if (url.origin !== base.origin) return undefined;
      pathname = url.pathname;
    } catch {
      return undefined;
    }
  }

  const slug = pathname.replace(/^\/+|\/+$/g, "");
  if (!slug.includes("/")) return undefined;

  const lastSegment = slug.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return undefined;

  const lower = slug.toLowerCase();
  return (
    index.find((entry) => entry.blogSlug.toLowerCase() === lower) ??
    index.find((entry) => entry.href.toLowerCase() === `/${lower}`)
  );
}
