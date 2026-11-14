export type ThemePreference = "system" | "light" | "dark";

// Self-contained: serialized below for pre-paint use, reused by the client store.
export function applyThemePreference(value: string | null) {
  const preference = value === "light" || value === "dark" ? value : "system";
  const theme = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = preference === "system" ? "light dark" : preference;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (meta) meta.content = preference === "system" ? "light dark" : preference;
  return theme;
}

// Storage access must not prevent applying the system fallback.
export const themeInitScript = `(${applyThemePreference.toString()})((function(){try{return localStorage.getItem('opskit-theme')}catch(_){return null}})());`;
