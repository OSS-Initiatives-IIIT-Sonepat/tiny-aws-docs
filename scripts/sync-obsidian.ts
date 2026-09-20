#!/usr/bin/env node
import path from "node:path";
import { loadEnvFiles } from "../src/lib/sync/load-env";
import {
  getSyncStatus,
  runPushToVengeance,
} from "../src/lib/sync/push-to-vengeance";
import { runPushToObsidian } from "../src/lib/sync/push-to-obsidian";

const rootDir = path.resolve(process.cwd());
loadEnvFiles(rootDir);

function printResult(
  label: string,
  result: {
    created: string[];
    updated: string[];
    skipped: string[];
  },
) {
  console.log(label);
  if (result.created.length) {
    console.log(`Created:\n  ${result.created.join("\n  ")}`);
  }
  if (result.updated.length) {
    console.log(`Updated:\n  ${result.updated.join("\n  ")}`);
  }
  if (result.skipped.length) {
    console.log(`Skipped:\n  ${result.skipped.join("\n  ")}`);
  }
}

function getOptionalTarget() {
  const cliArg = process.argv[3]?.trim();
  if (cliArg && !cliArg.startsWith("-")) {
    return cliArg;
  }

  const npmPath = process.env.npm_config_path?.trim();
  if (npmPath) {
    return npmPath;
  }

  return undefined;
}

function printUsage() {
  console.log(`Obsidian sync commands:

  npm run sync:status
  npm run sync:push
  npm run sync:pull              # pulls ALL posts from content/blog/

  Pull ONE Vengeance blog into Obsidian:
  npx tsx scripts/sync-obsidian.ts pull "frontend/example-post.md"

  Push ONE Obsidian note into the blog:
  npx tsx scripts/sync-obsidian.ts push "Blogs/Drafts/your-draft-post.md"

  Path pattern:
  content/blog/frontend/example.md  ->  Blogs/frontend/example.md
`);
}

const command = process.argv[2] ?? "help";

try {
  if (command === "help" || command === "--help" || command === "-h") {
    printUsage();
    process.exit(0);
  }

  const target = getOptionalTarget();

  if (command === "status") {
    const status = getSyncStatus(rootDir);
    console.log(`Vault: ${status.vaultPath}`);
    console.log(`Linked entries: ${status.linkedEntries}`);
    console.log(
      `Blog posts in content/blog/: ${status.blogs.totalBlogPosts} (${status.blogs.categories.map((c) => `${c.category}=${c.count}`).join(", ") || "none"})`,
    );
    for (const folder of status.folders) {
      console.log(
        `- ${folder.obsidianFolder} -> content/blog/${folder.blogCategory}/ | exists=${folder.folderExists} notes=${folder.noteCount}`,
      );
    }
    process.exit(0);
  }

  if (command === "push") {
    printResult(
      "Obsidian -> Vengeance sync complete",
      runPushToVengeance(rootDir, target),
    );
    process.exit(0);
  }

  if (command === "pull") {
    printResult(
      "Vengeance -> Obsidian sync complete",
      runPushToObsidian(rootDir, target),
    );
    process.exit(0);
  }

  printUsage();
  process.exit(1);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
