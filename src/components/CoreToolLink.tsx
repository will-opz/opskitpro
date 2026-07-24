"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { sendAnalyticsEvent } from "@/components/AnalyticsEvent";
import type { CoreToolId, ToolPlacement } from "@/lib/tool-catalog";

export function CoreToolLink({
  tool,
  placement,
  children,
  ...props
}: LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    tool: CoreToolId;
    placement: ToolPlacement;
    children: ReactNode;
  }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        sendAnalyticsEvent({
          event: "core_tool_open",
          tool,
          placement,
          page: window.location.pathname,
        });
        props.onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
