import { getPostBySegments } from "@/lib/blog-server";

function buildPostMarkdown(slug: string[]) {
  const post = getPostBySegments(slug);
  if (!post) return null;

  return [
    `# ${post.title}`,
    "",
    "AI-readable version of this post.",
    `Path: ${post.href}`,
    `Category: ${post.category}`,
    `Date: ${post.date}`,
    `Author: ${post.author}`,
    `Reading time: ${post.readingTime}`,
    post.description ? `Description: ${post.description}` : "",
    "",
    post.markdown.trim(),
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  const markdown = buildPostMarkdown(slug);

  if (!markdown) {
    return new Response("Post not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
