const DEFAULT_SITE_URL = "http://localhost:3000";
const PRODUCTION_SITE_URL = "https://tiny-aws.vercel.app";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  // Production canonicals stay on the public alias. VERCEL_URL is the
  // per-deployment host (tiny-aws-docs-*.vercel.app), which is not the site URL.
  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
