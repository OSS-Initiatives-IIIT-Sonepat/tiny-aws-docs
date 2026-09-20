import type { Metadata } from "next";
import type { BlogPost } from "@/lib/blog-types";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { getPostThumbnail, resolveThumbnailUrl } from "@/lib/thumbnail";

const DEFAULT_OG_IMAGE = "/vengeance-image.png";
const SITE_NAME = "tiny-aws docs";

function resolveCustomThumbnail(post: BlogPost) {
  const image = getPostThumbnail(post);
  if (!image) return undefined;

  return resolveThumbnailUrl(image, absoluteUrl);
}

function resolveGeneratedThumbnail(post: BlogPost) {
  return absoluteUrl(`/og/${post.slug}`);
}

export function buildPostMetadata(post: BlogPost): Metadata {
  const url = absoluteUrl(post.href);
  const thumbnail =
    resolveCustomThumbnail(post) ?? resolveGeneratedThumbnail(post);

  const imageMeta = [
    {
      url: thumbnail,
      width: 1200,
      height: 630,
      alt: post.title,
    },
  ];

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
      images: imageMeta,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: imageMeta.map((item) => item.url),
    },
  };
}

export function buildSiteMetadata(): Metadata {
  const image = absoluteUrl(DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: "tiny-aws docs",
      template: `%s | ${SITE_NAME}`,
    },
    description:
      "How cloud infrastructure actually works — AWS vs tiny-aws, Coolify vs tiny-aws, and everything in between.",
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: "tiny-aws docs",
      description:
        "How cloud infrastructure actually works — AWS vs tiny-aws, Coolify vs tiny-aws, and everything in between.",
      images: [{ url: image, alt: "tiny-aws docs" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "tiny-aws docs",
      description:
        "How cloud infrastructure actually works — AWS vs tiny-aws, Coolify vs tiny-aws, and everything in between.",
      images: [image],
    },
  };
}
