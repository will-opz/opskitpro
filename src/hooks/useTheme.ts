"use client";

import { useSyncExternalStore } from "react";
import { applyThemePreference, type ThemePreference } from "@/lib/theme-init";

const key = "opskit-theme";
const listeners = new Set<() => void>();
let preference: ThemePreference | undefined;
let snapshot = "system:light:light";
const normalize = (value: string | null | undefined): ThemePreference => value === "dark" || value === "light" ? value : "system";

function apply() {
  const resolved = applyThemePreference(preference ?? "system");
  const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  snapshot = `${preference ?? "system"}:${resolved}:${system}`;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  if (preference === undefined) {
    // The early script already read storage. Keep in-memory choices on remount,
    // especially when setItem/removeItem failed or storage is inaccessible.
    const initial = document.documentElement.dataset.themePreference;
    if (initial) preference = normalize(initial);
    else {
      try { preference = normalize(localStorage.getItem(key)); }
      catch { preference = "system"; }
    }
  }
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const systemChanged = () => apply();
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return;
    try { if (event.storageArea && event.storageArea !== localStorage) return; } catch { /* Blocked storage. */ }
    preference = normalize(event.newValue);
    apply();
  };
  media.addEventListener("change", systemChanged);
  window.addEventListener("storage", storageChanged);
  apply();
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", systemChanged);
    window.removeEventListener("storage", storageChanged);
  };
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  apply();
  try {
    if (next === "system") localStorage.removeItem(key);
    else localStorage.setItem(key, next);
  } catch { /* The current document keeps the choice even without persistence. */ }
}

export function useTheme() {
  const value = useSyncExternalStore(subscribe, () => snapshot, () => "system:light:light");
  const [mode, resolved, system] = value.split(":") as [ThemePreference, "light" | "dark", "light" | "dark"];
  return { preference: mode, resolved, system, setPreference: setThemePreference };
}
