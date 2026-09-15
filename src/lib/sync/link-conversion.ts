import type { WikilinkMode } from "./types";
import {
  type BlogLinkIndexEntry,
  resolveBlogHref,
  resolveWikilinkTarget,
} from "./link-index";
import { slugifyFileName } from "./parse-obsidian";

const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MARKDOWN_LINK_PATTERN = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;

function replaceOutsideProtected(
  markdown: string,
  replacer: (segment: string) => string,
) {
  const protectedSpans: string[] = [];
  let cursor = 0;

  const stash = (value: string) => {
    const token = `\x00PROTECTED_${cursor++}\x00`;
    protectedSpans.push(value);
    return token;
  };

  let working = markdown.replace(/```[\s\S]*?```/g, stash);
  working = working.replace(/`[^`\n]+`/g, stash);
  working = replacer(working);

  for (let index = protectedSpans.length - 1; index >= 0; index -= 1) {
    working = working.replace(
      `\x00PROTECTED_${index}\x00`,
      protectedSpans[index]!,
    );
  }

  return working;
}

export function convertWikilinksToBlogLinks(
  markdown: string,
  index: BlogLinkIndexEntry[],
  mode: WikilinkMode,
) {
  return replaceOutsideProtected(markdown, (segment) =>
    segment.replace(WIKILINK_PATTERN, (match, rawTarget, rawLabel) => {
      const target = String(rawTarget).trim();
      const label = rawLabel ? String(rawLabel).trim() : undefined;
      const resolved = resolveWikilinkTarget(target, index);

      if (mode === "plain") {
        return label ?? target;
      }

      if (resolved) {
        const text = label ?? resolved.title;
        return `[${text}](${resolved.href})`;
      }

      const fallbackText = label ?? target;
      const fallbackSlug = slugifyFileName(target);
      return `[${fallbackText}](${fallbackSlug ? `/${fallbackSlug}` : "#"})`;
    }),
  );
}

export function convertBlogLinksToWikilinks(
  markdown: string,
  index: BlogLinkIndexEntry[],
  siteUrl: string,
) {
  return replaceOutsideProtected(markdown, (segment) =>
    segment.replace(MARKDOWN_LINK_PATTERN, (match, rawText, rawHref) => {
      const text = String(rawText).trim();
      const href = String(rawHref).trim();
      const resolved = resolveBlogHref(href, index, siteUrl);

      if (!resolved) {
        return match;
      }

      if (text.toLowerCase() === resolved.fileStem.toLowerCase()) {
        return `[[${resolved.fileStem}]]`;
      }

      if (text === resolved.title) {
        return `[[${resolved.fileStem}]]`;
      }

      return `[[${resolved.fileStem}|${text}]]`;
    }),
  );
}
