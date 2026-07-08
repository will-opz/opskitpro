const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
  console.log('\n🚀 OpsKitPro Blog Post Generator\n');

  // 1. Get Slug
  let slug = '';
  while (!slug) {
    slug = await askQuestion('👉 Enter the URL slug (e.g., how-to-fix-cloudflare-522): ');
    slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  // 2. Get today's date
  const today = new Date().toISOString().split('T')[0];

  const enPath = path.join(__dirname, '..', 'src', 'content', 'blog', 'en', `${slug}.mdx`);
  const zhPath = path.join(__dirname, '..', 'src', 'content', 'blog', 'zh', `${slug}.mdx`);

  // 3. Check if exists
  if (fs.existsSync(enPath) || fs.existsSync(zhPath)) {
    console.error(`\n❌ Error: A post with slug "${slug}" already exists!`);
    rl.close();
    process.exit(1);
  }

  // 4. Content template
  const template = `---
title: "TODO: Write Title"
summary: "TODO: Write Summary"
publishedAt: "${today}"
readTime: "5 min"
category: "Guide"
tags: []
coverImage: ""
accent: "from-sky-500/10 via-blue-500/10 to-transparent"
actionKind: "tool"
ctaPath: "/tools/website-check"
related: []
---

## Introduction

Write your introduction here...

## Key Points

- Point 1
- Point 2

## Conclusion

Summarize your thoughts here.
`;

  // 5. Write files
  fs.writeFileSync(enPath, template, 'utf8');
  fs.writeFileSync(zhPath, template, 'utf8');

  console.log(`\n✅ Success! Created new MDX files for "${slug}":`);
  console.log(`  - src/content/blog/en/${slug}.mdx`);
  console.log(`  - src/content/blog/zh/${slug}.mdx`);

  console.log(`\n📌 Next steps:`);
  console.log(`  1. Edit the frontmatter and content in both files.`);
  console.log(`  2. Add a cover image to public/blog-covers/ if needed.`);
  console.log(`  3. Run \`npm run verify:fast\` to validate your content before committing.\n`);

  rl.close();
}

main().catch(err => {
  console.error(err);
  rl.close();
  process.exit(1);
});
