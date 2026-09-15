import { describe, expect, it } from "vitest";
import { getPostCoverSrc, resolveThumbnailSrc } from "../src/lib/thumbnail";

describe("resolveThumbnailSrc", () => {
  it("keeps absolute paths and urls as-is", () => {
    expect(resolveThumbnailSrc("/cover.png")).toBe("/cover.png");
    expect(resolveThumbnailSrc("https://cdn.example.com/cover.png")).toBe(
      "https://cdn.example.com/cover.png",
    );
  });

  it("normalizes bare filenames to public paths", () => {
    expect(resolveThumbnailSrc("cover.png")).toBe("/cover.png");
  });
});

describe("getPostCoverSrc", () => {
  it("uses custom thumbnail when set", () => {
    expect(
      getPostCoverSrc({
        slug: "about/about-template",
        thumbnail: "/cover.png",
      }),
    ).toBe("/cover.png");
  });

  it("falls back to generated OG route", () => {
    expect(getPostCoverSrc({ slug: "frontend/how-browsers-work" })).toBe(
      "/og/frontend/how-browsers-work",
    );
  });
});
