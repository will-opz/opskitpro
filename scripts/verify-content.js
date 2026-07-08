const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const contentDir = path.join(process.cwd(), "src/content/blog");
const publicDir = path.join(process.cwd(), "public");

const getPosts = (lang) => {
  const langDir = path.join(contentDir, lang);
  if (!fs.existsSync(langDir)) return [];
  const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".mdx"));
  
  return files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const content = fs.readFileSync(path.join(langDir, file), "utf8");
    const { data } = matter(content);
    return { slug, frontmatter: data, lang };
  });
};

function verifyContent() {
  console.log("Starting content integrity audit...\n");
  let hasError = false;

  const enPosts = getPosts("en");
  const zhPosts = getPosts("zh");

  const enSlugs = new Set(enPosts.map((p) => p.slug));
  const zhSlugs = new Set(zhPosts.map((p) => p.slug));

  // 1. Missing paired locale
  for (const slug of enSlugs) {
    if (!zhSlugs.has(slug)) {
      console.error(`[Error] Missing ZH translation for EN post: ${slug}`);
      hasError = true;
    }
  }
  for (const slug of zhSlugs) {
    if (!enSlugs.has(slug)) {
      console.error(`[Error] Missing EN translation for ZH post: ${slug}`);
      hasError = true;
    }
  }

  const allPosts = [...enPosts, ...zhPosts];

  for (const post of allPosts) {
    const { slug, lang, frontmatter } = post;
    const prefix = `[${lang.toUpperCase()}][${slug}]`;

    // 2. Frontmatter completeness (must have required fields)
    const required = ["title", "summary", "publishedAt", "readTime", "category"];
    for (const field of required) {
      if (!frontmatter[field]) {
        console.error(`${prefix} Missing required frontmatter field: ${field}`);
        hasError = true;
      }
    }

    // 3. Invalid publishedAt
    if (frontmatter.publishedAt) {
      const d = new Date(frontmatter.publishedAt);
      if (isNaN(d.getTime())) {
        console.error(`${prefix} Invalid publishedAt date format: ${frontmatter.publishedAt}`);
        hasError = true;
      }
    }

    // 4. Missing cover image
    if (frontmatter.coverImage) {
      const imgPath = path.join(publicDir, frontmatter.coverImage);
      if (!fs.existsSync(imgPath)) {
        console.error(`${prefix} Cover image does not exist: public${frontmatter.coverImage}`);
        hasError = true;
      }
    }

    // 5. Broken related slug
    if (frontmatter.related && Array.isArray(frontmatter.related)) {
      for (const relSlug of frontmatter.related) {
        if (lang === "en" && !enSlugs.has(relSlug)) {
          console.error(`${prefix} Broken related slug: ${relSlug}`);
          hasError = true;
        }
        if (lang === "zh" && !zhSlugs.has(relSlug)) {
          console.error(`${prefix} Broken related slug: ${relSlug}`);
          hasError = true;
        }
      }
    }

    // 6. Broken internal CTA path
    if (frontmatter.ctaPath) {
      const cta = frontmatter.ctaPath;
      if (!cta.startsWith("/") && !cta.startsWith("http")) {
        console.error(`${prefix} Invalid ctaPath format (must start with / or http): ${cta}`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.error("\nContent integrity audit FAILED.");
    process.exit(1);
  } else {
    console.log(`✓ Checked ${enPosts.length + zhPosts.length} posts successfully.`);
    console.log("Content integrity audit PASSED.");
    process.exit(0);
  }
}

verifyContent();
