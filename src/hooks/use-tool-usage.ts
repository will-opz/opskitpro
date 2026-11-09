"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { startToolRun } from "@/lib/audience-client";
type Outcome = "success" | "error" | "cancel" | "pending";
/** Mark only explicit actions. Render/initialization alone can never create a run. */
export function useToolUsage(tool: string, outcome: Outcome) {
  const current = useRef<ReturnType<typeof startToolRun> | null>(null);
  const [revision, setRevision] = useState(0);
  const begin = useCallback(() => {
    current.current?.finish("cancel");
    current.current = startToolRun(tool);
    setRevision(n => n + 1);
  }, [tool]);
  useEffect(() => {
    if (outcome !== "pending") { current.current?.finish(outcome); current.current = null; }
  }, [outcome, revision]);
  useEffect(() => () => { current.current?.finish("cancel"); current.current = null; }, []);
  return begin;
}
/** Reactive tools: one settled user edit after 1s, never initial defaults or each keystroke. */
export function useReactiveToolUsage(tool: string, outcome: Outcome) {
  const [revision, setRevision] = useState(0);
  const consumed = useRef(0);
  useEffect(() => {
    if (!revision || consumed.current === revision || outcome === "pending") return;
    const timer = setTimeout(() => {
      consumed.current = revision;
      if (outcome !== "cancel") startToolRun(tool).finish(outcome);
    }, 1000);
    return () => clearTimeout(timer);
  }, [tool, outcome, revision]);
  return useCallback(() => setRevision(n => n + 1), []);
}
