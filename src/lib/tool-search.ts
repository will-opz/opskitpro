import { productTools, type ProductTool, type ToolPrimaryCategory, type ToolProcessingMode, type ProductLocale } from "./tool-catalog";

export function normalizeToolQuery(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
const compact = (value: string) => normalizeToolQuery(value).replace(/\s/g, "");
const index = productTools.map((tool, order) => ({
  tool, order,
  names: [tool.id, tool.title.en, tool.title.zh].map(compact),
  aliases: [...tool.aliases.en, ...tool.aliases.zh].map(compact),
  tasks: [...tool.tasks.en, ...tool.tasks.zh].map(compact),
  text: normalizeToolQuery([tool.id, ...Object.values(tool.title), ...Object.values(tool.description), ...tool.tags, ...Object.values(tool.aliases).flat(), ...Object.values(tool.tasks).flat(), ...Object.values(tool.inputType), ...tool.acceptedInputTypes].join(" ")),
}));
export type ToolSearchResult = { tool: ProductTool; score: number; note?: string };
export function searchTools(query: string, options: { lang?: ProductLocale; category?: ToolPrimaryCategory | "all"; mode?: ToolProcessingMode | "all" } = {}): ToolSearchResult[] {
  const normalized = normalizeToolQuery(query);
  const needle = compact(query);
  const tokens = (normalized.match(/[a-z0-9]+|[\p{Script=Han}]+/gu) ?? []).filter(word => !["查","查看","的","the","a","not","no","please","tool","工具"].includes(word));
  return index.flatMap(entry => {
    const {tool} = entry;
    if (options.category && options.category !== "all" && tool.primaryCategory !== options.category) return [];
    if (options.mode && options.mode !== "all" && tool.processingMode !== options.mode) return [];
    let score = !needle ? 1 : 0;
    if (needle) {
      if (entry.tasks.includes(needle)) score = 1000;
      else if (entry.names.includes(needle)) score = 900;
      else if (entry.aliases.includes(needle)) score = 800;
      else if (entry.tasks.some(task => task.length >= 4 && needle.includes(task))) score = 700;
      else if (tokens.length && tokens.every(token => entry.text.includes(token))) {
        score = 100 + tokens.reduce((sum, token) => sum + (entry.names.some(name=>name.includes(token)) ? 40 : entry.aliases.some(alias=>alias.includes(token)) ? 25 : 5), 0);
      }
    }
    if (!score) return [];
    const note = tool.searchNotes?.find(note => note.terms.some(term=>needle.includes(compact(term))))?.text[options.lang ?? "en"];
    return [{ tool, score, note, order:entry.order }];
  }).sort((a,b)=>b.score-a.score || a.order-b.order).map(({tool,score,note})=>({tool,score,note}));
}
