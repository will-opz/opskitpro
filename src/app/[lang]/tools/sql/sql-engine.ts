type SqlFormatResult = {
  ok: boolean;
  formatted: string;
  error?: string;
};

const CLAUSE_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP",
  "ORDER",
  "LIMIT",
  "HAVING",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "JOIN",
  "LEFT",
  "RIGHT",
  "INNER",
  "OUTER",
  "FULL",
  "CROSS",
  "ON",
  "UNION",
  "UNION_ALL",
  "EXCEPT",
  "INTERSECT",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "CASE",
  "AS",
  "BY",
]);

const TWO_WORD_CLAUSES = new Map([
  ["GROUP BY", "GROUP BY"],
  ["ORDER BY", "ORDER BY"],
  ["INNER JOIN", "INNER JOIN"],
  ["LEFT JOIN", "LEFT JOIN"],
  ["RIGHT JOIN", "RIGHT JOIN"],
  ["FULL JOIN", "FULL JOIN"],
  ["CROSS JOIN", "CROSS JOIN"],
  ["UNION ALL", "UNION ALL"],
]);

function isWhitespace(char: string) {
  return /\s/.test(char);
}

function isIdentifierChar(char: string) {
  return /[A-Za-z0-9_$@.#:]/.test(char);
}

function tokenize(input: string) {
  const tokens: string[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];

    if (isWhitespace(current)) {
      continue;
    }

    if (current === "-" && input[index + 1] === "-") {
      let end = index + 2;
      while (end < input.length && input[end] !== "\n") end += 1;
      tokens.push(input.slice(index, end));
      index = end - 1;
      continue;
    }

    if (current === "/" && input[index + 1] === "*") {
      let end = index + 2;
      while (end < input.length - 1 && !(input[end] === "*" && input[end + 1] === "/")) {
        end += 1;
      }
      if (end >= input.length - 1) {
        throw new Error("unterminated_comment");
      }
      tokens.push(input.slice(index, end + 2));
      index = end + 1;
      continue;
    }

    if (current === "'" || current === `"` || current === "`") {
      const quote = current;
      let end = index + 1;
      while (end < input.length) {
        if (input[end] === "\\") {
          end += 2;
          continue;
        }
        if (input[end] === quote && input[end + 1] === quote) {
          end += 2;
          continue;
        }
        if (input[end] === quote) {
          tokens.push(input.slice(index, end + 1));
          index = end;
          break;
        }
        end += 1;
      }
      if (end >= input.length) {
        throw new Error("unterminated_string");
      }
      continue;
    }

    if ((/[\(\),;]/).test(current)) {
      tokens.push(current);
      continue;
    }

    if (current === "=" || current === ">" || current === "<" || current === "!" || current === "+" || current === "-" || current === "*" || current === "/" ) {
      let end = index + 1;
      while (end < input.length && /[=<>!]/.test(input[end])) {
        end += 1;
      }
      tokens.push(input.slice(index, end));
      index = end - 1;
      continue;
    }

    if (isIdentifierChar(current)) {
      let end = index + 1;
      while (end < input.length && isIdentifierChar(input[end])) {
        end += 1;
      }
      tokens.push(input.slice(index, end));
      index = end - 1;
      continue;
    }

    tokens.push(current);
  }
  return tokens;
}

function normalizeKeyword(value: string) {
  const upper = value.toUpperCase();
  return CLAUSE_KEYWORDS.has(upper) ? upper : value;
}

function detectCompoundClause(tokens: string[], index: number) {
  const current = normalizeKeyword(tokens[index]);
  const next = tokens[index + 1];
  if (!next) return null;
  const combined = `${current} ${normalizeKeyword(next)}`;
  if (TWO_WORD_CLAUSES.has(combined)) {
    return { clause: TWO_WORD_CLAUSES.get(combined)!, consume: 2 };
  }
  return null;
}

function pushLine(lines: string[], line: string) {
  const trimmed = line.trim();
  if (trimmed) lines.push(trimmed);
}

function isAndOrToken(value: string) {
  const normalized = value.toUpperCase();
  return normalized === "AND" || normalized === "OR";
}

function isJoinLikeToken(value: string) {
  const normalized = value.toUpperCase();
  return normalized === "JOIN" || normalized.endsWith(" JOIN");
}

export function formatSql(input: string): SqlFormatResult {
  const original = input.trim();
  if (!original) {
    return { ok: false, formatted: "", error: "empty_input" };
  }

  let tokens: string[];
  try {
    tokens = tokenize(original);
  } catch (error) {
    return {
      ok: false,
      formatted: "",
      error: error instanceof Error ? error.message : "parse_error",
    };
  }

  if (tokens.length === 0) {
    return { ok: false, formatted: "", error: "empty_input" };
  }

  const lines: string[] = [];
  let indent = 0;
  let line = "";
  const INDENT = "  ";

  const appendToken = (value: string, keepInline = false) => {
    const normalized = isAndOrToken(value) ? value.toUpperCase() : value;
    const spaced = keepInline || value === ")" || value === "," || value === ";" ? "" : " ";
    if (!line) {
      line = `${INDENT.repeat(indent)}${normalized}`;
      return;
    }

    if (value === "," || value === ")") {
      line += value;
      return;
    }

    if (value === "(") {
      line += value;
      return;
    }

    if (spaced) {
      line += ` ${normalized}`;
    } else {
      line += normalized;
    }
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = normalizeKeyword(tokens[index]);
    const compound = detectCompoundClause(tokens, index);
    const value = compound ? compound.clause : token;

    if (compound) {
      index += compound.consume - 1;
    }

    if (value === ";") {
      if (line.trim()) {
        line += ";";
      } else {
        line = `${line.trim()} ;`;
      }
      pushLine(lines, line);
      line = "";
      indent = 0;
      continue;
    }

    if (value === ",") {
      line += ",";
      pushLine(lines, line);
      line = "";
      continue;
    }

    if (value === "(") {
      appendToken(value);
      indent += 1;
      continue;
    }

    if (value === ")") {
      pushLine(lines, line);
      indent = Math.max(0, indent - 1);
      line = `${INDENT.repeat(indent)}${value}`;
      continue;
    }

    if (CLAUSE_KEYWORDS.has(value) || (value.includes(" ") && TWO_WORD_CLAUSES.has(value))) {
      if (line.trim()) {
        pushLine(lines, line);
      }
      line = `${INDENT.repeat(indent)}${value}`;
      if (value.includes(" ") && value.includes("BY")) {
        continue;
      }
      if (["SELECT", "FROM", "WHERE", "GROUP", "ORDER", "HAVING", "LIMIT", "INSERT", "UPDATE", "DELETE", "SET", "VALUES", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS", "UNION", "EXCEPT", "CASE", "END"].includes(value)) {
        if (value === "FROM" || value === "WHERE" || value === "GROUP" || value === "ORDER" || value === "HAVING" || isJoinLikeToken(value) || value === "LIMIT" || value === "SET" || value === "VALUES") {
          indent += 0;
        }
      }
      continue;
    }

    if (isAndOrToken(value)) {
      line += ` ${value}`;
      continue;
    }

    appendToken(value);
  }

  pushLine(lines, line);

  const formatted = lines.join("\n");
  if (!formatted.trim()) {
    return { ok: false, formatted: "", error: "format_failed" };
  }
  if (tokens.includes("(")) {
    const balance = tokens.filter((token) => token === "(").length - tokens.filter((token) => token === ")").length;
    if (balance !== 0) {
      return { ok: false, formatted: "", error: "unmatched_parentheses" };
    }
  }
  return { ok: true, formatted };
}

export type { SqlFormatResult };
