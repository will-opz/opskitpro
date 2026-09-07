import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceExample } from "./EvidenceExample";

describe("static diagnostic example boundaries", () => {
  it.each(["zh", "en"] as const)("separates locations, service and illustrative values in %s", (lang) => {
    render(<EvidenceExample lang={lang} />);
    expect(screen.getByRole("region")).toHaveAccessibleDescription(lang === "zh" ? "示例 · 非实时数据" : "Example · Not live data");
    const locations = screen.getByRole("group", { name: lang === "zh" ? "处理与观察位置" : "Processing and observation locations" });
    expect(within(locations).getAllByRole("button")).toHaveLength(3);
    expect(within(locations).queryByRole("button", { name: "DNS" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "DNS" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/Google.*Cloudflare/);
    expect(screen.getByRole("region")).not.toHaveTextContent(/EXTERNAL|Origin is reachable|Singapore|Tokyo/);
    expect(screen.getByRole("region")).toHaveTextContent("Edge HTTP 200 · Remote HTTP 403");
  });
});
