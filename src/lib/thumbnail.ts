export function resolveThumbnailSrc(thumbnail: string) {
  if (/^https?:\/\//i.test(thumbnail)) {
    return thumbnail;
  }

  return thumbnail.startsWith("/") ? thumbnail : `/${thumbnail}`;
}

export function resolveThumbnailUrl(
  thumbnail: string,
  toAbsolute: (path: string) => string,
) {
  if (/^https?:\/\//i.test(thumbnail)) {
    return thumbnail;
  }

  return toAbsolute(resolveThumbnailSrc(thumbnail));
}

export function getPostThumbnail(post: {
  thumbnail?: string;
  ogImage?: string;
}) {
  return post.thumbnail ?? post.ogImage;
}

/** Cover shown on the post page — custom thumbnail or auto-generated OG card. */
export function getPostCoverSrc(post: {
  slug: string;
  thumbnail?: string;
  ogImage?: string;
}) {
  const custom = getPostThumbnail(post);
  if (custom) return resolveThumbnailSrc(custom);
  return `/og/${post.slug}`;
}
