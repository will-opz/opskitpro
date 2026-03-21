const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'app');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walk(filepath, callback);
    } else if (stats.isFile() && filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  });
}

const map = [
  // Fix text contrast
  [/\btext-zinc-300\b/g, 'text-zinc-600'],
  [/\btext-zinc-400\b/g, 'text-zinc-600'],
  [/\btext-zinc-500\b/g, 'text-zinc-600'], // Force all gray text to be at least 600
  
  // Fix gradients
  [/\bfrom-white\b/g, 'from-zinc-800'],
  [/\to-white\b/g, 'to-zinc-800'],
  
  // Fix emerald color contrast to look more premium/subtle on lightbg
  [/\btext-emerald-400\b/g, 'text-emerald-600'],
  [/\btext-emerald-500\b/g, 'text-emerald-700'], // Darker emerald for better contrast
  
  [/\bfrom-emerald-400\b/g, 'from-emerald-600'],
  [/\bfrom-emerald-500\b/g, 'from-emerald-600'],
  
  // Fix overly transparent backgrounds
  [/\bbg-[#fafafa]\/40\b/g, 'bg-zinc-100'],
  [/\bbg-white\/40\b/g, 'bg-white/80'],
  [/\bbg-white\/50\b/g, 'bg-zinc-100'],
];

walk(directoryPath, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Let's do a quick pass
  map.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Fixed contrast in ${filepath}`);
  }
});
