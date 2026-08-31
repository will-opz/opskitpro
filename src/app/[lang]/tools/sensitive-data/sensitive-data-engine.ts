const MAX_INPUT_CHARS = 50_000;
export const SENSITIVE_TEXT_LIMIT = MAX_INPUT_CHARS;

const ENTITY_ORDER = [
  "private_key",
  "api_key",
  "password",
  "credit_card",
  "email",
  "phone",
  "uuid",
  "ip",
] as const;

export type SensitiveEntity = (typeof ENTITY_ORDER)[number];

type EnabledEntityMap = Record<SensitiveEntity, boolean>;

const SENSITIVE_BASE_LABELS: Record<SensitiveEntity, string> = {
  email: "Email",
  phone: "Phone",
  api_key: "API Key / Token",
  password: "Password / Credential",
  uuid: "UUID",
  private_key: "Private Key",
  credit_card: "Credit Card",
  ip: "IP Address",
} as const;

export const SENSITIVE_LABELS = {
  en: SENSITIVE_BASE_LABELS,
  zh: {
    email: "邮箱",
    phone: "手机号",
    api_key: "API Key / Token",
    password: "密码 / 凭据",
    uuid: "UUID",
    private_key: "私钥",
    credit_card: "信用卡",
    ip: "IP 地址",
  },
} as const;

export type SensitiveMatch = {
  type: SensitiveEntity;
  value: string;
  start: number;
  end: number;
  placeholder?: string;
};

export type SensitiveScanOptions = Partial<{
  enabled: Partial<EnabledEntityMap>;
  maxMatches: number;
}>;

export type SensitiveScanResult = {
  matches: SensitiveMatch[];
  truncated: boolean;
  total: number;
  counts: Record<SensitiveEntity, number>;
  redactedText: string;
  redactionMap: Record<string, { type: SensitiveEntity; index: number }>;
  limitHit: boolean;
};

const EMAIL_RE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
const PHONE_RE = /\b(?:\+?\d{1,4}[\s-]?)?(?:\(?\d{1,5}\)?[\s-]?)?(?:\d[\s-]*){10,16}\b/g;
const API_KEY_RE = /\b(?:sk-[A-Za-z0-9]{20,}|pk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xoxb-[0-9]{9,}-[0-9]{9,}-[A-Za-z0-9]{24,}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g;
const PRIVATE_KEY_RE = /-{5}BEGIN ([A-Z0-9 _-]*PRIVATE KEY)-{5}[\s\S]*?-{5}END \1-{5}|-{5}BEGIN(?:\s+[A-Z0-9 _-]+)?\s+PRIVATE KEY-{5}/gi;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const CREDIT_CARD_RE = /\b(?:\d[ -]*?){13,19}\b/g;
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

const PASSWORD_VALUE_PATTERNS = [
  /\b(?:mysql|mariadb)\b[^\r\n]*?\s-p"([^"\r\n]+)"/gi,
  /\b(?:mysql|mariadb)\b[^\r\n]*?\s-p'([^'\r\n]+)'/gi,
  /\b(?:mysql|mariadb)\b[^\r\n]*?\s-p((?!ort\b)[^\s"'=][^\s]*)/gi,
  /\b(?:mysql|mariadb)\b[^\r\n]*?\s--password="([^"\r\n]+)"/gi,
  /\b(?:mysql|mariadb)\b[^\r\n]*?\s--password='([^'\r\n]+)'/gi,
  /\b(?:mysql|mariadb)\b[^\r\n]*?\s--password=([^\s"'][^\s]*)/gi,
  /\b(?:password|passwd|pwd|mysql_pwd)\s*[:=]\s*"([^"\r\n]+)"/gi,
  /\b(?:password|passwd|pwd|mysql_pwd)\s*[:=]\s*'([^'\r\n]+)'/gi,
  /\b(?:password|passwd|pwd|mysql_pwd)\s*[:=]\s*([^\s,;"']+)/gi,
] as const;

function collectMatches(
  regex: RegExp,
  type: SensitiveEntity,
  input: string,
): SensitiveMatch[] {
  const matches: SensitiveMatch[] = [];
  for (const match of input.matchAll(regex)) {
    if (match.index === undefined) continue;
    const value = match[0];
    matches.push({
      type,
      value,
      start: match.index,
      end: match.index + value.length,
    });
  }
  return matches;
}

function collectCapturedMatches(
  regexes: readonly RegExp[],
  type: SensitiveEntity,
  input: string,
): SensitiveMatch[] {
  return regexes.flatMap((regex) => {
    const matches: SensitiveMatch[] = [];
    for (const match of input.matchAll(regex)) {
      if (match.index === undefined || !match[1]) continue;
      const value = match[1];
      const valueOffset = match[0].lastIndexOf(value);
      if (valueOffset < 0) continue;
      const start = match.index + valueOffset;
      matches.push({ type, value, start, end: start + value.length });
    }
    return matches;
  });
}

function isMatchAllDigits(input: string) {
  return /^\d+$/.test(input.replace(/[\s-]/g, ""));
}

function luhnCheck(value: string) {
  const digits = value.replace(/[^\d]/g, "").split("").map(Number);
  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits[index];
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isLikelyIpV4(value: string) {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

function validateCreditCard(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  if (!/^\d+$/.test(digits)) return false;
  if (new Set(digits).size === 1) return false;
  return luhnCheck(value);
}

function isLikelyPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 16) return false;
  if (validateCreditCard(value)) return false;
  if (new Set(digits).size === 1) return false;
  return true;
}

function isEnabled(type: SensitiveEntity, options: Partial<EnabledEntityMap> = {}) {
  return options[type] !== false;
}

export function detectSensitive(input: string, options: SensitiveScanOptions = {}): SensitiveScanResult {
  const maxMatches = options.maxMatches ?? 120;
  const enabled = options.enabled ?? {};
  const counts: Record<SensitiveEntity, number> = {
    email: 0,
    phone: 0,
    api_key: 0,
    password: 0,
    uuid: 0,
    private_key: 0,
    credit_card: 0,
    ip: 0,
  };

  const safeInput = input.slice(0, MAX_INPUT_CHARS);
  const matchesByType: Record<SensitiveEntity, SensitiveMatch[]> = {
    email: isEnabled("email", enabled) ? collectMatches(EMAIL_RE, "email", safeInput) : [],
    phone: isEnabled("phone", enabled)
      ? collectMatches(PHONE_RE, "phone", safeInput).filter((item) =>
          isLikelyPhone(item.value),
        )
      : [],
    api_key: isEnabled("api_key", enabled) ? collectMatches(API_KEY_RE, "api_key", safeInput) : [],
    password: isEnabled("password", enabled)
      ? collectCapturedMatches(PASSWORD_VALUE_PATTERNS, "password", safeInput)
      : [],
    uuid: isEnabled("uuid", enabled) ? collectMatches(UUID_RE, "uuid", safeInput) : [],
    private_key: isEnabled("private_key", enabled) ? collectMatches(PRIVATE_KEY_RE, "private_key", safeInput) : [],
    ip: isEnabled("ip", enabled)
      ? collectMatches(IP_RE, "ip", safeInput).filter((item) => isLikelyIpV4(item.value))
      : [],
    credit_card: isEnabled("credit_card", enabled)
      ? collectMatches(CREDIT_CARD_RE, "credit_card", safeInput)
        .filter((item) => isMatchAllDigits(item.value))
        .filter((item) => validateCreditCard(item.value))
      : [],
  };

  const priority = new Map(ENTITY_ORDER.map((type, index) => [type, index]));
  const result = ENTITY_ORDER.flatMap((type) => matchesByType[type]);
  result.sort((a, b) =>
    (a.start - b.start) ||
    (b.end - a.end) ||
    ((priority.get(a.type) ?? ENTITY_ORDER.length) - (priority.get(b.type) ?? ENTITY_ORDER.length)),
  );

  const filtered: SensitiveMatch[] = [];
  let cursor = 0;
  let limitHit = false;
  for (const match of result) {
    if (match.start < cursor) continue;
    if (match.end <= match.start) continue;
    if (filtered.length >= maxMatches) {
      limitHit = true;
      break;
    }
    filtered.push(match);
    counts[match.type] += 1;
    cursor = match.end;
  }

  const redactionCounters: Record<SensitiveEntity, number> = {
    email: 0,
    phone: 0,
    api_key: 0,
    password: 0,
    uuid: 0,
    private_key: 0,
    credit_card: 0,
    ip: 0,
  };
  const redactionMap: Record<string, { type: SensitiveEntity; index: number }> = {};

  const parts: string[] = [];
  let cursorOutput = 0;
  for (const match of filtered) {
    parts.push(safeInput.slice(cursorOutput, match.start));
    redactionCounters[match.type] += 1;
    const placeholder = `[${match.type.toUpperCase()}_${redactionCounters[match.type]}]`;
    match.placeholder = placeholder;
    parts.push(placeholder);
    redactionMap[placeholder] = { type: match.type, index: redactionCounters[match.type] };
    cursorOutput = match.end;
  }
  parts.push(safeInput.slice(cursorOutput));

  return {
    matches: filtered,
    truncated: input.length > MAX_INPUT_CHARS,
    total: filtered.length,
    counts,
    redactedText: parts.join(""),
    redactionMap,
    limitHit,
  };
};

export function buildSummaryText(
  result: SensitiveScanResult,
  lang: "en" | "zh" = "en",
) {
  const totalLabel =
    lang === "zh" ? `发现 ${result.total} 处可疑信息` : `Detected ${result.total} sensitive item(s)`;
  const parts = ENTITY_ORDER
    .map((type) => {
      const count = result.counts[type];
      if (!count) return "";
      const label = SENSITIVE_LABELS[lang][type];
      return lang === "zh" ? `${label} ${count}` : `${label}: ${count}`;
    })
    .filter(Boolean);
  return {
    header: totalLabel,
    detail: parts.join(lang === "zh" ? " · " : " · "),
  };
}
