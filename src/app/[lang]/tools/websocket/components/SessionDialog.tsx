"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import styles from "./session-dialog.module.css";

/** Native modal behavior, including focus containment/return and Escape. */
export function SessionDialog({ dialogRef, titleId, wide = false, children }: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  titleId: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const pressedOutside = useRef(false);
  const outside = (event: React.PointerEvent<HTMLDialogElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  };
  return <dialog
    ref={dialogRef}
    aria-labelledby={titleId}
    className={`${styles.dialog} ${wide ? styles.wide : ""}`}
    onPointerDown={event => { pressedOutside.current = event.button === 0 && outside(event); }}
    onPointerUp={event => {
      // Preserve light dismiss without closing on padding or a selection drag.
      if (pressedOutside.current && outside(event)) event.currentTarget.close();
      pressedOutside.current = false;
    }}
    onPointerCancel={() => { pressedOutside.current = false; }}
    onClose={() => { pressedOutside.current = false; }}
  >{children}</dialog>;
}
