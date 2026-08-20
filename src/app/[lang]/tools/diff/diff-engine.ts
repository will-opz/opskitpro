import { diffArrays } from "diff";

import {
  DIFF_CHARACTER_LIMIT,
  DIFF_LINE_LIMIT,
  type DiffHunk,
  type DiffOptions,
  type DiffResult,
  type DiffStats,
} from "./diff-contract";

export { DIFF_CHARACTER_LIMIT, DIFF_LINE_LIMIT } from "./diff-contract";

function splitLines(text: string) {
  if (text === "") return [];
  return text.replace(/\r\n?/g, "\n").split("\n");
}

function normalizeLine(line: string, options: DiffOptions) {
  let normalized = options.ignoreTrailingWhitespace ? line.replace(/[\t ]+$/u, "") : line;
  if (options.ignoreCase) normalized = normalized.toLowerCase();
  return normalized;
}

function numberedLines(lines: string[], startIndex: number) {
  return lines.map((text, index) => ({ text, lineNumber: startIndex + index + 1 }));
}

function pushHunk(hunks: DiffHunk[], hunk: DiffHunk) {
  const previous = hunks.at(-1);
  if (previous?.type === hunk.type && hunk.type === "change") {
    previous.oldLines.push(...hunk.oldLines);
    previous.newLines.push(...hunk.newLines);
    return;
  }
  hunks.push(hunk);
}

export function createTextDiff(oldText: string, newText: string, options: DiffOptions): DiffResult {
  if (oldText.length > DIFF_CHARACTER_LIMIT || newText.length > DIFF_CHARACTER_LIMIT) {
    return {
      ok: false,
      code: "character_limit",
      message: `Each input is limited to ${DIFF_CHARACTER_LIMIT} characters.`,
    };
  }

  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  if (oldLines.length > DIFF_LINE_LIMIT || newLines.length > DIFF_LINE_LIMIT) {
    return {
      ok: false,
      code: "line_limit",
      message: `Each input is limited to ${DIFF_LINE_LIMIT} lines.`,
    };
  }

  try {
    const oldKeys = oldLines.map((line) => normalizeLine(line, options));
    const newKeys = newLines.map((line) => normalizeLine(line, options));
    const changes = diffArrays(oldKeys, newKeys);
    const hunks: DiffHunk[] = [];
    let oldIndex = 0;
    let newIndex = 0;

    for (const change of changes) {
      const count = change.value.length;
      if (change.removed) {
        pushHunk(hunks, {
          type: "change",
          oldLines: numberedLines(oldLines.slice(oldIndex, oldIndex + count), oldIndex),
          newLines: [],
        });
        oldIndex += count;
      } else if (change.added) {
        pushHunk(hunks, {
          type: "change",
          oldLines: [],
          newLines: numberedLines(newLines.slice(newIndex, newIndex + count), newIndex),
        });
        newIndex += count;
      } else {
        pushHunk(hunks, {
          type: "equal",
          oldLines: numberedLines(oldLines.slice(oldIndex, oldIndex + count), oldIndex),
          newLines: numberedLines(newLines.slice(newIndex, newIndex + count), newIndex),
        });
        oldIndex += count;
        newIndex += count;
      }
    }

    const stats = hunks.reduce<DiffStats>((summary, hunk) => {
      if (hunk.type === "equal") {
        summary.unchanged += hunk.oldLines.length;
      } else {
        summary.additions += hunk.newLines.length;
        summary.deletions += hunk.oldLines.length;
        summary.changeBlocks += 1;
      }
      return summary;
    }, { additions: 0, deletions: 0, unchanged: 0, changeBlocks: 0 });

    return {
      ok: true,
      hunks,
      stats,
      different: stats.additions > 0 || stats.deletions > 0,
    };
  } catch (error) {
    return {
      ok: false,
      code: "engine_error",
      message: error instanceof Error ? error.message : "The diff engine could not compare these inputs.",
    };
  }
}
