/** Browser-safe form parsing; server-side SSRF checks remain authoritative. */
export function parseWebsiteTarget(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.replace(/\.$/, "");
    if (hostname.startsWith("[") && hostname.endsWith("]")) return hostname;
    if (hostname.length > 253 || !hostname.includes(".")) return null;
    if (!hostname.split(".").every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label))) return null;
    return hostname;
  } catch {
    return null;
  }
}

export function normalizeDiagnosticTarget(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::\d+)?$/.test(trimmed)) {
    return trimmed.split(":")[0];
  }

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    return parsed.hostname.replace(/\.$/, "");
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "")
      .replace(/\.$/, "")
      .trim();
  }
}
