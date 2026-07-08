import React from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export type CardPhase = "idle" | "loading" | "done" | "error";

export function ResultPanel({
  title,
  icon,
  phase,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  phase: CardPhase;
  children?: React.ReactNode;
}) {
  return (
    <div className="op-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
        <span className="text-[var(--accent-color)]">{icon}</span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] flex-1">
          {title}
        </h2>
        {phase === "loading" && (
          <Loader2 className="w-4 h-4 text-[var(--accent-color)] animate-spin" />
        )}
        {phase === "done" && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
        {phase === "error" && (
          <AlertCircle className="w-4 h-4 text-amber-500" />
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span
        className={`text-xs font-semibold text-[var(--text-primary)] ${mono ? "font-mono" : ""} max-w-[60%] text-right truncate`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export function StatBox({
  label,
  value,
  unit,
  quality,
}: {
  label: string;
  value: string | null;
  unit?: string;
  quality?: "good" | "ok" | "bad";
}) {
  const colors = {
    good: "text-emerald-500",
    ok: "text-amber-500",
    bad: "text-red-500",
  };
  return (
    <div className="op-card-soft rounded-xl p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">
        {label}
      </p>
      {value !== null ? (
        <p
          className={`text-2xl font-bold ${quality ? colors[quality] : "text-[var(--text-primary)]"}`}
        >
          {value}
          {unit && (
            <span className="text-xs ml-1 text-[var(--text-muted)]">
              {unit}
            </span>
          )}
        </p>
      ) : (
        <div className="h-8 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-color)] animate-spin" />
        </div>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "ok" | "slow" | "failed" | "info";
}) {
  const map = {
    ok: "bg-emerald-500",
    slow: "bg-amber-400",
    failed: "bg-red-400",
    info: "bg-blue-400",
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]}`} />
  );
}

export function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  const gradeColor =
    grade === "A"
      ? "#10b981"
      : grade === "B"
        ? "#34d399"
        : grade === "C"
          ? "#f59e0b"
          : grade === "D"
            ? "#f97316"
            : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={gradeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-3xl font-black" style={{ color: gradeColor }}>
          {grade}
        </p>
        <p className="text-[10px] font-semibold text-[var(--text-muted)]">
          {score}/100
        </p>
      </div>
    </div>
  );
}
