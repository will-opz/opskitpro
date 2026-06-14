const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Refactor generateMetadata
  content = content.replace(
    /export async function generateMetadata\(\)\s*:\s*Promise<Metadata>\s*\{/g,
    'export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {'
  );

  // 2. Refactor default page export
  content = content.replace(
    /export default async function ([A-Za-z0-9_]+)\(\)\s*\{/g,
    'export default async function $1({ params }: { params: { lang: string } }) {'
  );

  // 3. Replace the cookieStore and lang derivation
  const cookieRegex = /\s*const cookieStore = cookies\(\);?\s*\n\s*const lang = \(cookieStore\.get\([^)]+\)\?\.value \|\| ['"][^'"]+['"]\) as [^\n]+;/g;
  content = content.replace(cookieRegex, '\n  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";');
  
  // Also handle single quotes or missing semicolons
  const cookieRegex2 = /\s*const cookieStore = cookies\(\)\s*\n\s*const lang = \(cookieStore\.get\([^)]+\)\?\.value \|\| ['"][^'"]+['"]\) as [^\n]+/g;
  content = content.replace(cookieRegex2, '\n  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";');

  // 4. Remove `import { cookies }` if unused
  if (!content.includes('cookies()') && !content.includes('cookies,')) {
    content = content.replace(/import\s*\{\s*cookies\s*\}\s*from\s*['"]next\/headers['"];?\n/g, '');
  }
  // Handle `import { cookies, headers }`
  content = content.replace(/import\s*\{\s*cookies,\s*headers\s*\}\s*from\s*['"]next\/headers['"];?\n/g, '');
  content = content.replace(/import\s*\{\s*headers\s*\}\s*from\s*['"]next\/headers['"];?\n/g, '');

  // 5. Hardcode or refactor any remaining headers() usage
  content = content.replace(/const headersList = headers\(\)\s*\n\s*const host = headersList\.get\('host'\) \|\| 'opskitpro\.com'\s*\n\s*const protocol = headersList\.get\('x-forwarded-proto'\) \|\| [^\n]+\s*\n/g, 'const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://opskitpro.com"\n');
  content = content.replace(/`\$\{protocol\}:\/\/\$\{host\}([^`]+)`/g, '`${baseUrl}$1`');


  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Refactored:', filePath);
  }
}

walk('./src/app/[lang]', refactorFile);
