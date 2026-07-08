import GithubSlugger from "github-slugger";

export interface TocHeading {
  text: string;
  id: string;
  level: number;
}

export function extractTocFromMarkdown(content: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];

  // Remove code blocks before parsing to avoid extracting comment headings
  const textWithoutCode = content.replace(/```[\s\S]*?```/g, "");

  const lines = textWithoutCode.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      let rawText = match[2].trim();
      // Remove inline links [Text](url) -> Text
      rawText = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      // Remove bold/italics
      rawText = rawText.replace(/[*_]{1,2}(.*?)[*_]{1,2}/g, "$1");
      
      const id = slugger.slug(rawText);
      headings.push({ text: rawText, id, level });
    }
  }

  return headings;
}
