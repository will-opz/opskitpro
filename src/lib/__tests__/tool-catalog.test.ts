import { describe, expect, it } from "vitest";
import {
  coreTools,
  localizeTool,
  observationPointCopy,
  productTools,
} from "@/lib/tool-catalog";

describe("product tool catalog", () => {
  it("keeps the three flagship tools in the approved order and routes", () => {
    expect(coreTools.map(({ id, href }) => ({ id, href }))).toEqual([
      { id: "website-check", href: "/tools/website-check" },
      { id: "network-doctor", href: "/tools/network-check" },
      { id: "dns-security", href: "/tools/dns-lookup" },
    ]);
  });

  it("keeps public products separate from external personal links", () => {
    expect(productTools.every((tool) => tool.href.startsWith("/tools/"))).toBe(
      true,
    );
    expect(productTools.some((tool) => tool.href.startsWith("http"))).toBe(
      false,
    );
  });

  it("localizes product names and defines the three observation points", () => {
    expect(localizeTool(coreTools[1], "en").title).toBe("Network Doctor");
    expect(localizeTool(coreTools[2], "zh").title).toBe("DNS 安全检查");
    expect(Object.keys(observationPointCopy)).toEqual([
      "browser",
      "edge",
      "probe",
    ]);
  });

  it("declares a task category and truthful processing path for every tool", () => {
    expect(productTools).toHaveLength(22);
    expect(productTools.filter((tool) => tool.processingMode === "local")).toHaveLength(15);
    expect(productTools.filter((tool) => tool.processingMode === "network")).toHaveLength(7);
    expect(productTools.find((tool) => tool.id === "websocket")?.networkPath).toBe("direct-target");
    expect(productTools.filter((tool) => tool.processingMode === "local").every((tool) => tool.networkPath === "none")).toBe(true);
  });
});
