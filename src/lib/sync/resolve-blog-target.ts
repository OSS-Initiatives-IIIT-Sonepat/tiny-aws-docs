import fs from "node:fs";
import path from "node:path";

const BLOG_ROOT = path.join("content", "blog");

export type ResolvedBlogTarget = {
  blogPath: string;
  blogSlug: string;
  blogAbsPath: string;
  category: string;
  fileName: string;
};

export function normalizeBlogTargetInput(input: string) {
  let value = input.trim().replace(/\\/g, "/");

  if (value.startsWith("content/blog/")) {
    value = value.slice("content/blog/".length);
  }

  if (value.endsWith(".md")) {
    value = value.slice(0, -3);
  }

  return value.replace(/^\/+|\/+$/g, "");
}

export function resolveBlogTarget(
  rootDir: string,
  input: string,
): ResolvedBlogTarget {
  const blogSlug = normalizeBlogTargetInput(input);

  if (!blogSlug.includes("/")) {
    throw new Error(
      `Blog path must include a category, e.g. frontend/how-browsers-work (got: ${input})`,
    );
  }

  const blogPath = path.join(BLOG_ROOT, `${blogSlug}.md`).replace(/\\/g, "/");
  const blogAbsPath = path.join(rootDir, blogPath);

  if (!fs.existsSync(blogAbsPath)) {
    throw new Error(`Blog file not found: ${blogPath}`);
  }

  const segments = blogSlug.split("/");
  const fileName = `${segments.at(-1)}.md`;
  const category = segments[0] ?? "";

  return {
    blogPath,
    blogSlug,
    blogAbsPath,
    category,
    fileName,
  };
}

export function buildObsidianPathForBlog(
  obsidianBlogRoot: string,
  blogSlug: string,
) {
  return `${obsidianBlogRoot.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "")}/${blogSlug}.md`;
}

export type IndexedBlogPost = {
  blogPath: string;
  blogSlug: string;
  category: string;
};

export function collectAllBlogPosts(rootDir: string): IndexedBlogPost[] {
  const blogRoot = path.join(rootDir, "content", "blog");
  if (!fs.existsSync(blogRoot)) {
    return [];
  }

  const posts: IndexedBlogPost[] = [];

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

      const slug = fileEntry.name.replace(/\.md$/i, "");
      posts.push({
        blogPath: path
          .join("content", "blog", categoryEntry.name, fileEntry.name)
          .replace(/\\/g, "/"),
        blogSlug: `${categoryEntry.name}/${slug}`,
        category: categoryEntry.name,
      });
    }
  }

  return posts.sort((a, b) => a.blogSlug.localeCompare(b.blogSlug));
}
