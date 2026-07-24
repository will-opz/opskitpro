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
