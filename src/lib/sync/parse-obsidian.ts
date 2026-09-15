import type { WikilinkMode } from "./types";
import { convertWikilinksToBlogLinks } from "./link-conversion";
import type { BlogLinkIndexEntry } from "./link-index";

export function convertWikilinks(
  markdown: string,
  mode: WikilinkMode,
  index: BlogLinkIndexEntry[] = [],
) {
  return convertWikilinksToBlogLinks(markdown, index, mode);
}

export function slugifyFileName(fileName: string) {
  return fileName
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
