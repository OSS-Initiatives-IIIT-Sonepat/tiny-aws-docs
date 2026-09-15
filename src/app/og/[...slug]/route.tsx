import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySegments } from "@/lib/blog-server";

type RouteProps = {
  params: Promise<{ slug: string[] }>;
};

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

function renderThumbnail(post?: ReturnType<typeof getPostBySegments>) {
  const category = post?.category ?? "Blog";
  const title = post?.title ?? "Vengeance Blog";
  const description = truncate(
    post?.description ?? "Markdown blog powered by Vengeance UI",
    120,
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background:
          "linear-gradient(145deg, #09090b 0%, #18181b 55%, #27272a 100%)",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 28,
          color: "#a1a1aa",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#fafafa",
          }}
        />
        {category}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 32,
            lineHeight: 1.35,
            color: "#d4d4d8",
            maxWidth: 900,
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 28,
          color: "#71717a",
        }}
      >
        <span>Vengeance Blog</span>
        <span>{post?.readingTime ?? "Preview"}</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.segments }));
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const post = getPostBySegments(slug);
  return renderThumbnail(post);
}
