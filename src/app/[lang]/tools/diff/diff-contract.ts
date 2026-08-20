export const DIFF_CHARACTER_LIMIT = 100_000;
export const DIFF_LINE_LIMIT = 10_000;

export type DiffOptions = {
  ignoreCase: boolean;
  ignoreTrailingWhitespace: boolean;
};

export type DiffLine = { text: string; lineNumber: number };

export type DiffHunk = {
  type: "equal" | "change";
  oldLines: DiffLine[];
  newLines: DiffLine[];
};

export type DiffStats = {
  additions: number;
  deletions: number;
  unchanged: number;
  changeBlocks: number;
};

export type DiffSuccess = {
  ok: true;
  hunks: DiffHunk[];
  stats: DiffStats;
  different: boolean;
};

export type DiffFailure = {
  ok: false;
  code: "character_limit" | "line_limit" | "engine_error";
  message: string;
};

export type DiffResult = DiffSuccess | DiffFailure;

export type DiffRequest = {
  id: number;
  oldText: string;
  newText: string;
  options: DiffOptions;
};

export type DiffResponse = { id: number; result: DiffResult };
