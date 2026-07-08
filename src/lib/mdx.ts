import "server-only";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";

export const BlogFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  readTime: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  accent: z.string().optional(),
  actionKind: z.string().optional(),
  ctaPath: z.string().optional(),
  related: z.array(z.string()).default([]),
});

export type BlogFrontmatter = z.infer<typeof BlogFrontmatterSchema>;

export type MdxPost = {
  slug: string;
  source: "mdx";
  content: string;
  frontmatter: BlogFrontmatter;
};

const contentDir = path.join(process.cwd(), "src/content/blog");

export function getMdxPosts(lang: string): MdxPost[] {
  const langDir = path.join(contentDir, lang);
  if (!fs.existsSync(langDir)) {
    return [];
  }

  const files = fs.readdirSync(langDir).filter((file) => file.endsWith(".mdx"));

  return files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const filePath = path.join(langDir, file);
    const fileContent = fs.readFileSync(filePath, "utf8");

    const { data, content } = matter(fileContent);

    // Validate frontmatter
    const frontmatter = BlogFrontmatterSchema.parse(data);

    return {
      slug,
      source: "mdx",
      content,
      frontmatter,
    };
  });
}

export function getMdxPost(lang: string, slug: string): MdxPost | null {
  const filePath = path.join(contentDir, lang, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);
  const frontmatter = BlogFrontmatterSchema.parse(data);

  return {
    slug,
    source: "mdx",
    content,
    frontmatter,
  };
}
