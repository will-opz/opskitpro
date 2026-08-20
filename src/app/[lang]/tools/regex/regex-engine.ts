export const REGEX_PATTERN_LIMIT = 2_000;
export const REGEX_TEXT_LIMIT = 100_000;
export const REGEX_MATCH_LIMIT = 500;

export type RegexMatch = {
  value: string;
  index: number;
  end: number;
  groups: Array<{ name?: string; value: string | null }>;
  zeroLength: boolean;
};

export type RegexSuccess = {
  ok: true;
  matches: RegexMatch[];
  truncated: boolean;
  durationMs: number;
};

export type RegexFailure = {
  ok: false;
  code: "empty" | "pattern_limit" | "text_limit" | "syntax";
  message: string;
};

export type RegexResult = RegexSuccess | RegexFailure;

export type RegexRequest = {
  id: number;
  pattern: string;
  flags: string;
  text: string;
};

export type RegexResponse = {
  id: number;
  result: RegexResult;
};

function advanceStringIndex(text: string, index: number, unicode: boolean) {
  if (!unicode || index + 1 >= text.length) return index + 1;
  const first = text.charCodeAt(index);
  if (first < 0xd800 || first > 0xdbff) return index + 1;
  const second = text.charCodeAt(index + 1);
  return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

function collectGroups(match: RegExpExecArray) {
  const indexed = match.slice(1).map((value, index) => ({
    name: String(index + 1),
    value: value ?? null,
  }));
  const named = Object.entries(match.groups ?? {}).map(([name, value]) => ({
    name,
    value: value ?? null,
  }));
  return [...indexed, ...named];
}

export function executeRegex(
  pattern: string,
  flags: string,
  text: string,
  now: () => number = () => performance.now(),
): RegexResult {
  if (!pattern) return { ok: false, code: "empty", message: "Enter a regular expression." };
  if (pattern.length > REGEX_PATTERN_LIMIT) {
    return { ok: false, code: "pattern_limit", message: `Pattern exceeds ${REGEX_PATTERN_LIMIT} characters.` };
  }
  if (text.length > REGEX_TEXT_LIMIT) {
    return { ok: false, code: "text_limit", message: `Test text exceeds ${REGEX_TEXT_LIMIT} characters.` };
  }

  let expression: RegExp;
  try {
    expression = new RegExp(pattern, flags);
  } catch (error) {
    return {
      ok: false,
      code: "syntax",
      message: error instanceof Error ? error.message : "Invalid regular expression.",
    };
  }

  const startedAt = now();
  const matches: RegexMatch[] = [];
  const collectAll = flags.includes("g") || flags.includes("y");
  let truncated = false;

  while (matches.length < REGEX_MATCH_LIMIT) {
    const match = expression.exec(text);
    if (!match) break;
    const value = match[0];
    const index = match.index;
    matches.push({
      value,
      index,
      end: index + value.length,
      groups: collectGroups(match),
      zeroLength: value.length === 0,
    });
    if (!collectAll) break;
    if (value.length === 0) {
      expression.lastIndex = advanceStringIndex(text, expression.lastIndex, flags.includes("u"));
    }
  }

  if (matches.length === REGEX_MATCH_LIMIT) {
    const next = expression.exec(text);
    truncated = next !== null;
  }

  return { ok: true, matches, truncated, durationMs: Math.max(0, now() - startedAt) };
}
