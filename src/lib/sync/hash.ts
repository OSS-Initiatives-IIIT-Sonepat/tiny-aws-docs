import { createHash } from "node:crypto";

export function hashContent(content: string) {
  return createHash("sha256").update(content.trim(), "utf8").digest("hex");
}
