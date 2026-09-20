import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/:slug*/for-ai",
        destination: "/for-ai/:slug*",
      },
    ];
  },
};

export default nextConfig;
