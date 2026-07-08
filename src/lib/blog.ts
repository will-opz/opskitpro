import "server-only";
import { getBlogPosts, getBlogPost, Lang } from "@/content/blog-posts";
import { getMdxPosts, getMdxPost, MdxPost, BlogFrontmatter } from "./mdx";

export type UnifiedBlogPost = {
  slug: string;
  source: "mdx" | "legacy";

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

  // If mdx
  content?: string;

  // If legacy
  sections?: any[];
};

function mapLegacyToUnified(post: any, lang: Lang): UnifiedBlogPost {
  // Try to parse ctaPath from ctaUrl
  let ctaPath = "";
  if (post.ctaUrl) {
    try {
      const u = new URL(post.ctaUrl);
      ctaPath = u.pathname.replace(/^\/(en|zh|ja|tw)/, "") || "/";
    } catch {
      // not a url, use as path
      ctaPath = post.ctaUrl;
    }
  }

  return {
    slug: post.slug,
    source: "legacy",
    title: post.title,
    summary: post.summary,
    publishedAt: post.date,
    readTime: post.readTime,
    category: post.tag,
    tags: [post.tag],
    coverImage: post.coverImage,
    accent: post.accent,
    actionKind: post.actionKind,
    ctaPath,
    related: post.related || [],
    sections: post.sections,
  };
}

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
  const legacyPosts = getBlogPosts(lang as Lang).map((p) =>
    mapLegacyToUnified(p, lang as Lang),
  );
  const mdxPosts = getMdxPosts(lang).map(mapMdxToUnified);

  const mdxSlugs = new Set(mdxPosts.map((p) => p.slug));
  const filteredLegacy = legacyPosts.filter((p) => !mdxSlugs.has(p.slug));

  const combined = [...mdxPosts, ...filteredLegacy];
  combined.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return combined;
}

export function getBlogPostBySlug(
  lang: string,
  slug: string,
): UnifiedBlogPost | null {
  const mdx = getMdxPost(lang, slug);
  if (mdx) {
    return mapMdxToUnified(mdx);
  }

  const legacy = getBlogPost(slug, lang as Lang);
  if (legacy) {
    return mapLegacyToUnified(legacy, lang as Lang);
  }

  return null;
}
