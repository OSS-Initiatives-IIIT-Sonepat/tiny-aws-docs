import "server-only";

import { codeToHtml } from "shiki";

/**
 * Regex matching fenced code blocks:
 *   ```lang
 *   ...code...
 *   ```
 * The language part may include a file path suffix:  ```go|src/main.go
 */
const FENCE_RE = /```([^\n`]*)\n([\s\S]*?)```/g;

/**
 * Replace every fenced code block in `markdown` with pre-highlighted HTML
 * produced by Shiki. The resulting <pre> carries data-language so the
 * BlogCodeBlock renderer can pick up the language badge.
 *
 * Called server-side only (async, uses Shiki).
 */
export async function highlightMarkdown(markdown: string): Promise<string> {
  const matches = [...markdown.matchAll(FENCE_RE)];
  if (matches.length === 0) return markdown;

  const parts: string[] = [];
  let cursor = 0;

  for (const match of matches) {
    const [full, langRaw, body] = match;
    const start = match.index!;

    // Text before this code fence — emit as-is
    parts.push(markdown.slice(cursor, start));
    cursor = start + full.length;

    // Split lang from optional file-path suffix  (```go|src/main.go)
    const pipeIdx = langRaw.indexOf("|");
    const lang = (pipeIdx === -1 ? langRaw : langRaw.slice(0, pipeIdx)).trim();
    const filePath = pipeIdx === -1 ? "" : langRaw.slice(pipeIdx + 1).trim();
    const code = body.trimEnd();

    // Mermaid blocks are handled by the MermaidDiagram component at render
    // time — we must NOT highlight them with Shiki.
    if (lang === "mermaid") {
      parts.push(full);
      continue;
    }

    try {
      const highlighted = await codeToHtml(code, {
        lang: lang || "plaintext",
        theme: "github-dark-dimmed",
        transformers: [
          {
            pre(node) {
              // Expose language + optional filepath for the renderer
              node.properties["data-language"] = lang || "plaintext";
              if (filePath) node.properties["data-filepath"] = filePath;
              // Remove Shiki's inline background — we use our own bg-[#101116]
              if (typeof node.properties.style === "string") {
                node.properties.style = node.properties.style
                  .replace(/background-color\s*:[^;]+;?\s*/g, "")
                  .replace(/background\s*:[^;]+;?\s*/g, "")
                  .trim();
              }
            },
          },
        ],
      });
      // Emit with surrounding blank lines so rehype-raw treats it as a block
      parts.push("\n" + highlighted + "\n");
    } catch {
      // Fallback: plain pre block — still better than crashing
      const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      parts.push(
        `\n<pre data-language="${lang || "plaintext"}"><code>${escaped}</code></pre>\n`,
      );
    }
  }

  // Remaining text after the last fence
  parts.push(markdown.slice(cursor));
  return parts.join("");
}
