import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  BlogCategory,
  BlogLink,
  BlogPost,
  TOCHeading,
} from "@/lib/blog-types";

const BLOG_ROOT = path.join(process.cwd(), "content", "blog");
const NEW_DAYS = 21;

type Frontmatter = {
  title?: string;
  description?: string;
  author?: string;
  inspiredBy?: string;
  date?: string;
  readingTime?: string;
  isNew?: boolean;
  ogImage?: string;
  thumbnail?: string;
};

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeMarkdownSlug(slug: string, counts: Map<string, number>) {
  const nextCount = (counts.get(slug) ?? 0) + 1;
  counts.set(slug, nextCount);
  return nextCount > 1 ? `${slug}-${nextCount}` : slug;
}

export function getMarkdownHeadings(markdown: string): TOCHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const usedSlugs = new Map<string, number>();
  const headings: TOCHeading[] = [];
  let match = headingRegex.exec(markdown);

  while (match) {
    const hashes = match[1];
    const rawTitle = match[2].trim().replace(/\s+#+\s*$/, "");
    const depth: 2 | 3 = hashes.length === 3 ? 3 : 2;
    const baseSlug =
      slugifyHeading(rawTitle) || `section-${headings.length + 1}`;
    headings.push({
      id: normalizeMarkdownSlug(baseSlug, usedSlugs),
      title: rawTitle,
      depth,
    });
    match = headingRegex.exec(markdown);
  }

  return headings;
}

function getReadingTime(markdown: string) {
  const words = markdown
    .replace(/```[\s\S]*?```/g, "")
    .trim()
    .split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min`;
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>-]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectMarkdownFiles(dir: string, acc: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectMarkdownFiles(abs, acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      acc.push(abs);
    }
  }
}

function isRecentDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return false;
  const diffMs = Date.now() - parsed.getTime();
  return diffMs <= NEW_DAYS * 24 * 60 * 60 * 1000;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_ROOT)) return [];
  const files: string[] = [];
  collectMarkdownFiles(BLOG_ROOT, files);

  return files
    .map((absPath) => {
      const rel = path.relative(BLOG_ROOT, absPath);
      const noExt = rel.replace(/\.md$/, "");
      const segments = noExt.split(path.sep).filter(Boolean);
      const slug = segments.join("/");
      const href = `/${slug}`;
      const category = titleCase(segments[0] ?? "General");

      const source = fs.readFileSync(absPath, "utf8");
      const parsed = matter(source);
      const data = parsed.data as Frontmatter;
      const markdown = parsed.content.trim();
      const headings = getMarkdownHeadings(markdown);
      const fallbackTitle = titleCase(
        segments[segments.length - 1] ?? "Untitled",
      );
      const date = data.date ?? "2026-01-01";

      return {
        slug,
        segments,
        href,
        title: data.title ?? fallbackTitle,
        description: data.description ?? "",
        author: data.author ?? "tiny-aws",
        inspiredBy: data.inspiredBy ?? "tiny-aws docs",
        date,
        readingTime: data.readingTime ?? getReadingTime(markdown),
        isNew: data.isNew ?? isRecentDate(date),
        ogImage: data.ogImage,
        thumbnail: data.thumbnail,
        category,
        markdown,
        headings,
      } satisfies BlogPost;
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getPostBySegments(segments: string[]) {
  const joined = segments.join("/");
  return getAllPosts().find((post) => post.slug === joined);
}

export function getBlogCategories(posts: BlogPost[]): BlogCategory[] {
  const byCategory = new Map<string, BlogCategory>();
  for (const post of posts) {
    const categorySlug = post.segments[0]?.toLowerCase() ?? "general";
    if (!byCategory.has(categorySlug)) {
      byCategory.set(categorySlug, {
        slug: categorySlug,
        name: titleCase(categorySlug),
        items: [],
      });
    }
    byCategory.get(categorySlug)?.items.push({
      title: post.title,
      href: post.href,
      isNew: post.isNew,
    });
  }

  return [...byCategory.values()]
    .map((category) => ({
      ...category,
      items: category.items.sort((a, b) => a.href.localeCompare(b.href)),
    }))
    .sort((a, b) => {
      if (a.slug === "about") return -1;
      if (b.slug === "about") return 1;
      return a.name.localeCompare(b.name);
    });
}

export function getBlogLinks(posts: BlogPost[]): BlogLink[] {
  return posts.map((post) => ({
    title: post.title,
    href: post.href,
    category: post.category,
    description: post.description,
    searchText: stripMarkdown(post.markdown),
  }));
}

export function getAdjacentPosts(slug: string): {
  prev?: BlogPost;
  next?: BlogPost;
} {
  const posts = getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? posts[index - 1] : undefined,
    next: index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

export function getDefaultPostPath() {
  const posts = getAllPosts();
  const preferred = posts.find((post) => post.segments[0] === "about");
  const first = preferred ?? posts[0];
  return first?.href ?? "/";
}
