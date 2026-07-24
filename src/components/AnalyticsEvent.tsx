"use client";

import { useEffect } from "react";
import type { CoreToolId, ToolPlacement } from "@/lib/tool-catalog";

export type FunnelEvent =
  | "core_tool_impression"
  | "core_tool_open"
  | "core_tool_run"
  | "core_tool_success"
  | "core_tool_error";

export function sendAnalyticsEvent(input: {
  event: FunnelEvent;
  tool: CoreToolId;
  placement?: ToolPlacement;
  page?: string;
}) {
  try {
    const payload = JSON.stringify(input);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/event",
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }
    void fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Analytics must never block product usage.
  }
}

export function CoreToolImpressions({
  tools,
  placement,
}: {
  tools: CoreToolId[];
  placement: ToolPlacement;
}) {
  useEffect(() => {
    tools.forEach((tool) =>
      sendAnalyticsEvent({
        event: "core_tool_impression",
        tool,
        placement,
        page: window.location.pathname,
      }),
    );
  }, [placement, tools]);

  return null;
}
