export const CRON_MINUTE_MIN = 0;
export const CRON_MINUTE_MAX = 59;
export const CRON_HOUR_MIN = 0;
export const CRON_HOUR_MAX = 23;
export const CRON_DAY_MIN = 1;
export const CRON_DAY_MAX = 31;
export const CRON_MONTH_MIN = 1;
export const CRON_MONTH_MAX = 12;
export const CRON_WEEKDAY_MIN = 0;
export const CRON_WEEKDAY_MAX = 7;

export const CRON_FIELD_LIMIT = 200;

type CronFieldType = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export type CronFieldDescriptor = {
  type: CronFieldType;
  label: { en: string; zh: string };
  min: number;
  max: number;
  allowsQuestionMark?: boolean;
  map?: Record<string, number>;
  reverseMap?: Record<number, string>;
};

type CronValidationState = {
  ok: boolean;
  message: string;
  warnings: string[];
};

export type CronExplainResult = {
  ok: boolean;
  expression: string;
  parsed: string[];
  explanations: Array<{ field: CronFieldType; description: string }>;
  errors: string[];
};

export const cronFieldDescriptors: Record<CronFieldType, CronFieldDescriptor> = {
  minute: {
    type: "minute",
    label: { en: "Minute", zh: "分钟" },
    min: CRON_MINUTE_MIN,
    max: CRON_MINUTE_MAX,
  },
  hour: {
    type: "hour",
    label: { en: "Hour", zh: "小时" },
    min: CRON_HOUR_MIN,
    max: CRON_HOUR_MAX,
  },
  dayOfMonth: {
    type: "dayOfMonth",
    label: { en: "Day of month", zh: "每月日期" },
    min: CRON_DAY_MIN,
    max: CRON_DAY_MAX,
    allowsQuestionMark: false,
  },
  month: {
    type: "month",
    label: { en: "Month", zh: "月份" },
    min: CRON_MONTH_MIN,
    max: CRON_MONTH_MAX,
    map: {
      jan: 1,
      feb: 2,
      mar: 3,
      apr: 4,
      may: 5,
      jun: 6,
      jul: 7,
      aug: 8,
      sep: 9,
      oct: 10,
      nov: 11,
      dec: 12,
    },
    reverseMap: {
      1: "Jan",
      2: "Feb",
      3: "Mar",
      4: "Apr",
      5: "May",
      6: "Jun",
      7: "Jul",
      8: "Aug",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dec",
    },
  },
  dayOfWeek: {
    type: "dayOfWeek",
    label: { en: "Day of week", zh: "星期" },
    min: CRON_WEEKDAY_MIN,
    max: CRON_WEEKDAY_MAX,
    allowsQuestionMark: false,
    map: {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    },
    reverseMap: {
      0: "Sun",
      1: "Mon",
      2: "Tue",
      3: "Wed",
      4: "Thu",
      5: "Fri",
      6: "Sat",
      7: "Sun",
    },
  },
};

export type CronPreset = {
  id: string;
  title: { en: string; zh: string };
  description: { en: string; zh: string };
  expression: string;
};

export const cronPresets: CronPreset[] = [
  {
    id: "every-minute",
    title: { en: "Every minute", zh: "每分钟" },
    description: { en: "Run every minute", zh: "每分钟执行" },
    expression: "* * * * *",
  },
  {
    id: "every-5-minutes",
    title: { en: "Every 5 minutes", zh: "每 5 分钟" },
    description: { en: "Run every 5 minutes", zh: "每 5 分钟执行" },
    expression: "*/5 * * * *",
  },
  {
    id: "hourly",
    title: { en: "Hourly", zh: "每小时" },
    description: { en: "Run at minute 0 each hour", zh: "整点执行" },
    expression: "0 * * * *",
  },
  {
    id: "daily-9am",
    title: { en: "Daily 09:00", zh: "每天 09:00" },
    description: { en: "Run every day at 09:00", zh: "每天 09:00 执行" },
    expression: "0 9 * * *",
  },
  {
    id: "workdays-morning",
    title: { en: "Mon-Fri 09:00", zh: "周一到周五 09:00" },
    description: { en: "Weekdays at 09:00", zh: "工作日 09:00 执行" },
    expression: "0 9 * * 1-5",
  },
  {
    id: "monthly-first",
    title: { en: "Monthly 1st day 00:00", zh: "每月 1 号 00:00" },
    description: { en: "Run at 00:00 on day 1 of each month", zh: "每月 1 日 00:00 执行" },
    expression: "0 0 1 * *",
  },
];

function tokenToNumber(raw: string, descriptor: CronFieldDescriptor): number | null {
  const token = raw.trim().toLowerCase();
  if (!token.length) return null;
  if (descriptor.map && Object.prototype.hasOwnProperty.call(descriptor.map, token)) {
    return descriptor.map[token];
  }
  if (/^-?\d+$/.test(token)) {
    const numeric = Number(token);
    if (Number.isNaN(numeric)) return null;
    return numeric;
  }
  return null;
}

function formatValue(value: number, descriptor: CronFieldDescriptor): string {
  if (descriptor.reverseMap && Object.prototype.hasOwnProperty.call(descriptor.reverseMap, value)) {
    return descriptor.reverseMap[value];
  }
  return String(value);
}

function describeRange(raw: string): string {
  const [start, end, step] = raw.split(/[-/]/);
  if (step) {
    return `${start} through ${end} every ${step}`;
  }
  return `${start} through ${end}`;
}

function validateToken(token: string, descriptor: CronFieldDescriptor): CronValidationState {
  const raw = token.trim().toLowerCase();
  if (!raw) return { ok: false, message: "empty_token", warnings: [] };

  if ((descriptor.allowsQuestionMark ?? false) && (raw === "?" || raw === "*")) {
    return { ok: true, message: "", warnings: [] };
  }
  if (raw === "*") return { ok: true, message: "", warnings: [] };

  const stepParts = raw.split("/");
  if (stepParts.length > 2) return { ok: false, message: "bad_step", warnings: [] };
  if (stepParts.length === 2) {
    const [base, step] = stepParts;
    if (!step || !/^\d+$/.test(step)) return { ok: false, message: "bad_step", warnings: [] };
    const stepValue = Number(step);
    if (stepValue <= 0) return { ok: false, message: "bad_step", warnings: [] };
    if (base === "*" || /^\d+(?:-\d+)?$/.test(base) || /^[a-z]{3}-[a-z]{3}$/.test(base)) {
      if (base.includes("-")) {
        const rangeParts = base.split("-");
        if (rangeParts.length !== 2) return { ok: false, message: "bad_range", warnings: [] };
        const start = tokenToNumber(rangeParts[0], descriptor);
        const end = tokenToNumber(rangeParts[1], descriptor);
        if (start === null || end === null) return { ok: false, message: "bad_range", warnings: [] };
        if (start > end) return { ok: false, message: "bad_range_order", warnings: [] };
        if (start < descriptor.min || end > descriptor.max) return { ok: false, message: "out_of_range", warnings: [] };
      }
      if (/^\d+$/.test(base)) {
        const baseValue = Number(base);
        if (baseValue < descriptor.min || baseValue > descriptor.max) return { ok: false, message: "out_of_range", warnings: [] };
      }
      return { ok: true, message: "", warnings: [] };
    }
    return { ok: false, message: "bad_step_base", warnings: [] };
  }

  const parts = raw.split(",");
  if (parts.length > 1) {
    for (const part of parts) {
      const parsed = validateToken(part, descriptor);
      if (!parsed.ok) return parsed;
    }
    return { ok: true, message: "", warnings: [] };
  }

  if (raw.includes("-")) {
    const rangeParts = raw.split("-");
    if (rangeParts.length !== 2) return { ok: false, message: "bad_range", warnings: [] };
    const start = tokenToNumber(rangeParts[0], descriptor);
    const end = tokenToNumber(rangeParts[1], descriptor);
    if (start === null || end === null) return { ok: false, message: "bad_range", warnings: [] };
    if (start < descriptor.min || end > descriptor.max) return { ok: false, message: "out_of_range", warnings: [] };
    if (start > end) return { ok: false, message: "bad_range_order", warnings: [] };
    return { ok: true, message: "", warnings: [] };
  }

  const single = tokenToNumber(raw, descriptor);
  if (single === null) return { ok: false, message: "bad_number_or_alias", warnings: [] };
  if (single < descriptor.min || single > descriptor.max) return { ok: false, message: "out_of_range", warnings: [] };
  return { ok: true, message: "", warnings: [] };
}

function describeField(expression: string, descriptor: CronFieldDescriptor): string {
  const raw = expression.trim().toLowerCase();
  if (raw === "*" || raw === "?") {
    return `Every ${descriptor.label.en.toLowerCase()}`;
  }
  if (raw.startsWith("*/") && /^\d+$/.test(raw.slice(2))) {
    return `Every ${raw.slice(2)} ${descriptor.label.en.toLowerCase()}(s)`;
  }
  if (raw.includes(",")) {
    const values = raw.split(",").map((item) => {
      const value = tokenToNumber(item, descriptor);
      return value !== null ? formatValue(value, descriptor) : item;
    });
    return `At ${values.join(", ")}`;
  }
  if (/^-?\d+$/.test(raw) || (descriptor.map && Object.prototype.hasOwnProperty.call(descriptor.map, raw))) {
    const value = tokenToNumber(raw, descriptor);
    if (value !== null) {
      return `At ${formatValue(value, descriptor).toLowerCase()}`;
    }
  }
  if (raw.includes("/") && /^\w{3,}$/.test(raw.split("/")[0])) {
    const [start, step] = raw.split("/");
    if (/^\d+$/.test(step)) {
      return `From ${start.toUpperCase()} every ${step} ${descriptor.label.en.toLowerCase()}`;
    }
    return `From ${start.toUpperCase()} with step ${step}`;
  }
  if (raw.includes("-")) {
    if (/^\w{3}-\w{3}$/.test(raw)) {
      return describeRange(raw);
    }
    if (/^\d{1,2}-\d{1,2}\/\d{1,2}$/.test(raw)) {
      return describeRange(raw);
    }
    return describeRange(raw);
  }
  return `Custom value ${expression}`;
}

export function parseCronExpression(input: string): CronExplainResult {
  const normalized = input.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ");
  if (parts.length !== 5) {
    return {
      ok: false,
      expression: normalized,
      parsed: parts.slice(0, 5),
      explanations: [],
      errors: ["cron_format_error"],
    };
  }

  const errors: string[] = [];
  const explanations: CronExplainResult["explanations"] = [];

  const fieldOrder: CronFieldType[] = ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"];
  for (const fieldType of fieldOrder) {
    const descriptor = cronFieldDescriptors[fieldType];
    const token = parts[fieldOrder.indexOf(fieldType)] ?? "";
    const validate = validateToken(token, descriptor);
    if (!validate.ok) {
      errors.push(`cron_${fieldType}_invalid_${validate.message}`);
      continue;
    }
    explanations.push({
      field: fieldType,
      description: describeField(token, descriptor),
    });
  }

  return {
    ok: errors.length === 0,
    expression: normalized,
    parsed: parts,
    explanations,
    errors,
  };
}

export function parseCronExpressionWithWarnings(input: string): CronExplainResult {
  return parseCronExpression(input);
}
