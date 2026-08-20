import { dump, load, type DumpOptions } from "js-yaml";

const YAML_MAX_CHARS = 50_000;

export const YAML_LIMITS = {
  maxChars: YAML_MAX_CHARS,
} as const;

export type YamlError = {
  line: number;
  column: number;
  reason: string;
};

export type YamlFormatResult = {
  valid: boolean;
  formatted?: string;
  error?: YamlError;
  errorMessage: string;
};

export type YamlValidationResult = {
  valid: boolean;
  error?: YamlError;
  errorMessage: string;
};

const DUMP_OPTIONS: DumpOptions = {
  indent: 2,
  lineWidth: -1,
  noRefs: true,
  sortKeys: false,
};

function toLineColumn(mark?: { line?: number; column?: number }) {
  const line = typeof mark?.line === "number" ? mark.line + 1 : 1;
  const column = typeof mark?.column === "number" ? mark.column + 1 : 1;
  return { line, column };
}

function parseYaml(input: string): { value: unknown; line?: number; column?: number; reason?: string } {
  try {
    return { value: load(input) };
  } catch (error) {
    const yamlError = error as { reason?: string; message?: string; mark?: { line?: number; column?: number } };
    const position = toLineColumn(yamlError.mark);
    return {
      value: undefined,
      line: position.line,
      column: position.column,
      reason: yamlError.reason || yamlError.message || "Invalid YAML syntax",
    };
  }
}

export function validateYaml(input: string): YamlValidationResult {
  if (!input.trim()) {
    return {
      valid: false,
      errorMessage: "请输入要校验的 YAML 内容。",
    };
  }

  if (input.length > YAML_MAX_CHARS) {
    return {
      valid: false,
      errorMessage: "输入内容过长，建议先缩减到 50,000 字符以内。",
    };
  }

  const parsed = parseYaml(input);
  if (parsed.value === undefined && parsed.reason) {
    return {
      valid: false,
      error: {
        line: parsed.line ?? 1,
        column: parsed.column ?? 1,
        reason: parsed.reason,
      },
      errorMessage: parsed.reason,
    };
  }

  return { valid: true, errorMessage: "YAML 校验通过。" };
}

export function formatYaml(input: string, indent = 2): YamlFormatResult {
  const validation = validateYaml(input);
  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
      errorMessage: validation.errorMessage,
    };
  }

  const parsed = parseYaml(input);
  const output = dump(parsed.value, {
    ...DUMP_OPTIONS,
    indent,
  });

  return {
    valid: true,
    formatted: output.trimEnd(),
    errorMessage: "格式化成功。",
  };
}
