import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/blog/post-view";
import { TableOfContents } from "@/components/layout/toc";
import {
  getAllPosts,
  getBlogLinks,
  getPostBySegments,
} from "@/lib/blog-server";
import { buildPostMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.segments }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySegments(slug);
  if (!post) return {};
  return buildPostMetadata(post);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySegments(slug);
  if (!post) notFound();
  const allPosts = getAllPosts();

  return (
    <>
      <main className="relative min-w-0 py-8 md:pl-8 lg:pl-12 xl:pl-20">
        <div className="w-full min-w-0 max-w-6xl">
          <BlogPostView
            post={post}
            markdown={post.markdown}
            headings={post.headings}
          />
        </div>
      </main>
      <TableOfContents
        items={post.headings}
        currentSlug={post.slug}
        links={getBlogLinks(allPosts)}
      />
    </>
  );
}
