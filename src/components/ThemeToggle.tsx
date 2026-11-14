"use client";

import { useId, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/lib/theme-init";

export function ThemeToggle({ lang = "en" }: { lang?: "en" | "zh" }) {
  const { preference, resolved, system, setPreference } = useTheme();
  const id = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const zh = lang === "zh";
  const labels = { system: zh ? "跟随系统" : "System", light: zh ? "亮色" : "Light", dark: zh ? "暗色" : "Dark" };
  const title = `${zh ? "主题设置" : "Theme settings"}: ${labels[preference]}`;
  const Icon = resolved === "dark" ? Moon : Sun;
  return <details ref={details} className="relative" onKeyDown={event => {
    if (event.key === "Escape" && details.current?.open) {
      event.preventDefault();
      details.current.open = false;
      details.current.querySelector("summary")?.focus();
    }
  }}>
    <summary aria-label={title} title={title} className="ui-button-ghost flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-[var(--border-subtle)] p-0 [&::-webkit-details-marker]:hidden">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </summary>
    <fieldset className="absolute right-0 z-50 mt-2 min-w-48 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-secondary)] p-2 shadow-lg">
      <legend className="sr-only">{zh ? "主题" : "Theme"}</legend>
      {(["system", "light", "dark"] as const).map(mode => <label key={mode} htmlFor={`${id}-${mode}`} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]">
        <input id={`${id}-${mode}`} type="radio" name={id} value={mode} checked={preference === mode} onChange={() => setPreference(mode as ThemePreference)} />
        <span>{labels[mode]}{mode === "system" && <span className="text-xs text-[var(--text-muted)]"> ({labels[system]})</span>}</span>
      </label>)}
    </fieldset>
  </details>;
}
