export type ParsedColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type ColorParseResult = {
  ok: boolean;
  color?: ParsedColor;
  error?: "empty_input" | "invalid_format" | "invalid_range";
};

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
}

function parseHex(input: string): ParsedColor | null {
  const normalized = input.startsWith("#") ? input.slice(1) : input;
  if (!/^[0-9a-fA-F]+$/.test(normalized)) return null;

  if (normalized.length === 3 || normalized.length === 4) {
    const r = Number.parseInt(`${normalized[0]}${normalized[0]}`, 16);
    const g = Number.parseInt(`${normalized[1]}${normalized[1]}`, 16);
    const b = Number.parseInt(`${normalized[2]}${normalized[2]}`, 16);
    const a = normalized.length === 4 ? Number.parseInt(`${normalized[3]}${normalized[3]}`, 16) : 255;
    return { r, g, b, a };
  }
  if (normalized.length === 6 || normalized.length === 8) {
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    const a = normalized.length === 8 ? Number.parseInt(normalized.slice(6, 8), 16) : 255;
    return { r, g, b, a };
  }
  return null;
}

function parseRgb(input: string): ParsedColor | null {
  const match = input.match(/^rgba?\((.*?)\)$/i);
  if (!match) return null;
  const parts = match[1].split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;

  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  if ([r, g, b].some((value) => clamp(value, 0, 255) === null || !Number.isInteger(value))) return null;
  const a = parts[3] === undefined ? 255 : Number.parseFloat(parts[3]);
  if (a < 0 || a > 1 || Number.isNaN(a)) return null;

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: Math.round(a * 255) };
}

function parseHsl(input: string): ParsedColor | null {
  const match = input.match(/^hsla?\((.*?)\)$/i);
  if (!match) return null;

  const source = match[1].trim();
  const hasSlash = source.includes("/");
  const [rawColor, rawAlpha] = hasSlash ? source.split("/", 2) : [source, undefined];
  const parts = rawColor.includes(",")
    ? rawColor.split(",")
    : rawColor.split(/\s+/);
  const normalizedParts = parts.map((part) => part.trim()).filter(Boolean);
  if (normalizedParts.length < 3 || normalizedParts.length > 4) return null;

  const h = Number(normalizedParts[0]);
  const s = Number(normalizedParts[1]?.replace("%", ""));
  const l = Number(normalizedParts[2]?.replace("%", ""));
  const alphaText = rawAlpha ?? normalizedParts[3];

  if ([h, s, l].some((value) => Number.isNaN(value))) return null;
  if (s < 0 || s > 100 || l < 0 || l > 100) return null;
  const alpha = alphaText === undefined ? 255 : Number.parseFloat(alphaText);
  if (alpha < 0 || alpha > 1 || Number.isNaN(alpha)) return null;

  const hue = ((h % 360) + 360) % 360;
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;
  if (hue < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (hue < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (hue < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (hue < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (hue < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  const r = Math.round((rPrime + m) * 255);
  const g = Math.round((gPrime + m) * 255);
  const b = Math.round((bPrime + m) * 255);
  return { r, g, b, a: Math.round(alpha * 255) };
}

function toHex(value: number) {
  return Math.round(value).toString(16).toUpperCase().padStart(2, "0");
}

export function parseColor(input: string): ColorParseResult {
  const value = input.trim();
  if (!value) {
    return { ok: false, error: "empty_input" };
  }

  const parsers = [parseHex, parseRgb, parseHsl];
  for (const parser of parsers) {
    const parsed = parser(value);
    if (parsed) {
      if (
        parsed.r < 0 ||
        parsed.r > 255 ||
        parsed.g < 0 ||
        parsed.g > 255 ||
        parsed.b < 0 ||
        parsed.b > 255
      ) {
        return { ok: false, error: "invalid_range" };
      }
      return { ok: true, color: parsed };
    }
  }

  return { ok: false, error: "invalid_format" };
}

export function formatColor(color: ParsedColor) {
  const hexAlpha = color.a === 255 ? "" : toHex(color.a);
  const alpha = color.a === 255 ? 1 : Math.round((color.a / 255 + Number.EPSILON) * 1000) / 1000;
  const normalizedHex = `${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}${hexAlpha}`.toLowerCase();
  const normalizedHexWithHash = `#${normalizedHex}`;
  const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
  const rgbWithAlpha = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;

  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
  }
  const hsl = `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
  const hslWithAlpha =
    color.a === 255
      ? hsl
      : `hsla(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}% / ${alpha})`;

  return {
    hex: normalizedHexWithHash,
    rgb: color.a === 255 ? rgb : rgbWithAlpha,
    hsl: hslWithAlpha,
    alpha: alpha,
    normalized: color.a === 255 ? `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}` : `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`,
  };
}
