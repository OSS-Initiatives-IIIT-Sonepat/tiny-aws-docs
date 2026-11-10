import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

function legacyDocRedirects() {
  const root = path.join(process.cwd(), "content", "blog");
  if (!fs.existsSync(root)) return [];

  const redirects: { source: string; destination: string; permanent: false }[] =
    [];

  for (const category of fs.readdirSync(root, { withFileTypes: true })) {
    if (!category.isDirectory() || category.name.startsWith(".")) continue;
    const dir = path.join(root, category.name);
    for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith(".md") || file.name.startsWith(".")) {
        continue;
      }
      const slug = file.name.replace(/\.md$/i, "");
      const from = `/${category.name}/${slug}`;
      redirects.push({
        source: from,
        destination: `/docs${from}`,
        permanent: false,
      });
      redirects.push({
        source: `${from}/for-ai`,
        destination: `/docs${from}/for-ai`,
        permanent: false,
      });
    }
  }

  return redirects;
}

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return legacyDocRedirects();
  },
  async rewrites() {
    return [
      {
        source: "/docs/:slug*/for-ai",
        destination: "/for-ai/:slug*",
      },
    ];
  },
};

export default nextConfig;
