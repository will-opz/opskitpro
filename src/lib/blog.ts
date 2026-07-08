import "server-only";
import { getMdxPosts, getMdxPost, MdxPost } from "./mdx";

export type UnifiedBlogPost = {
  slug: string;
  source: "mdx";
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  category?: string;
  tags: string[];
  coverImage?: string;
  accent?: string;
  actionKind?: string;
  ctaPath?: string;
  related: string[];
  content?: string;
};

function mapMdxToUnified(post: MdxPost): UnifiedBlogPost {
  return {
    slug: post.slug,
    source: "mdx",
    title: post.frontmatter.title,
    summary: post.frontmatter.summary,
    publishedAt: post.frontmatter.publishedAt,
    updatedAt: post.frontmatter.updatedAt,
    readTime: post.frontmatter.readTime,
    category: post.frontmatter.category,
    tags: post.frontmatter.tags,
    coverImage: post.frontmatter.coverImage,
    accent: post.frontmatter.accent,
    actionKind: post.frontmatter.actionKind,
    ctaPath: post.frontmatter.ctaPath,
    related: post.frontmatter.related,
    content: post.content,
  };
}

export function getAllBlogPosts(lang: string): UnifiedBlogPost[] {
  const mdxPosts = getMdxPosts(lang).map(mapMdxToUnified);

  mdxPosts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return mdxPosts;
}

export function getBlogPostBySlug(
  lang: string,
  slug: string,
): UnifiedBlogPost | null {
  const mdx = getMdxPost(lang, slug);
  if (mdx) {
    return mapMdxToUnified(mdx);
  }

  return null;
}
