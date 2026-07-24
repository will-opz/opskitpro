import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("analytics event route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a bounded core funnel event without target data", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const request = new NextRequest("https://opskitpro.com/api/event", {
      method: "POST",
      body: JSON.stringify({
        event: "core_tool_open",
        tool: "network-doctor",
        placement: "home",
        page: "/en/?domain=private.example",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const record = JSON.parse(String(log.mock.calls[0][0]));
    expect(record).toMatchObject({
      event: "core_tool_open",
      tool: "network-doctor",
      placement: "home",
      page: "/en/",
    });
    expect(record.target).toBeUndefined();
  });

  it("rejects unknown tools and placements", async () => {
    for (const body of [
      { event: "core_tool_run", tool: "ip-lookup" },
      {
        event: "core_tool_impression",
        tool: "website-check",
        placement: "unknown",
      },
    ]) {
      const response = await POST(
        new NextRequest("https://opskitpro.com/api/event", {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }),
      );
      expect(response.status).toBe(400);
    }
  });
});
