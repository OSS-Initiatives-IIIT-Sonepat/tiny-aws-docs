import type { BlogPost } from "@/lib/blog-types";
import type { BlogLinkIndexEntry } from "@/lib/sync/link-index";
import { convertWikilinksToBlogLinks } from "@/lib/sync/link-conversion";

export function postsToLinkIndex(posts: BlogPost[]): BlogLinkIndexEntry[] {
  return posts.map((post) => {
    const fileStem = post.segments.at(-1) ?? post.slug;
    return {
      blogSlug: post.slug,
      href: post.href,
      title: post.title,
      fileStem,
    };
  });
}

/** Normalize blog markdown for the website: wikilinks → clickable routes. */
export function normalizeBlogMarkdownForSite(
  markdown: string,
  index: BlogLinkIndexEntry[],
) {
  return convertWikilinksToBlogLinks(markdown, index, "markdown");
}
