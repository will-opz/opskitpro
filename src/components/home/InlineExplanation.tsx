"use client";

import { useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./home.module.css";

/** Short, non-interactive explanation: hover/focus to inspect, tap to pin, Escape to dismiss. */
export function InlineExplanation({ children, description, alignEnd = false }: { children: ReactNode; description: string; alignEnd?: boolean }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const root = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!root.current || !tooltip.current) return;
      const anchor = root.current.getBoundingClientRect();
      const width = tooltip.current.getBoundingClientRect().width;
      const preferred = alignEnd ? anchor.right - width : anchor.left;
      const left = Math.max(16, Math.min(preferred, document.documentElement.clientWidth - width - 16));
      tooltip.current.style.left = `${left - anchor.left}px`;
      tooltip.current.style.right = "auto";
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, alignEnd]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent | PointerEvent) => {
      if (("key" in event && event.key === "Escape") ||
        (event.type === "pointerdown" && !root.current?.contains(event.target as Node))) {
        pinned.current = false;
        setOpen(false);
      }
    };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => { document.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", dismiss); };
  }, [open]);
  return <span ref={root} className={styles.explanation}
    onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }}
    onPointerLeave={() => { if (!pinned.current && !root.current?.contains(document.activeElement)) setOpen(false); }}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { pinned.current = false; setOpen(false); } }}>
    <button type="button" className={styles.badge} aria-describedby={id} aria-expanded={open} aria-controls={id}
      onFocus={() => setOpen(true)}
      onClick={() => { pinned.current = !pinned.current; setOpen(pinned.current); }}>
      {children}
    </button>
    <span ref={tooltip} id={id} role="tooltip" hidden={!open} className={`${styles.explanationText} ${alignEnd ? styles.explanationEnd : ""}`}>{description}</span>
  </span>;
}
