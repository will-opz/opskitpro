import { NextRequest, NextResponse } from "next/server";
import type { ReachabilityItem } from "@/lib/api-contracts";

export const dynamic = "force-dynamic";

const TARGETS: { url: string; label: string }[] = [
  { url: "https://www.google.com", label: "Google" },
  { url: "https://www.youtube.com", label: "YouTube" },
  { url: "https://github.com", label: "GitHub" },
  { url: "https://openai.com", label: "OpenAI" },
  { url: "https://www.cloudflare.com", label: "Cloudflare" },
  { url: "https://aws.amazon.com", label: "AWS" },
  { url: "https://x.com", label: "X (Twitter)" },
  { url: "https://www.baidu.com", label: "Baidu" },
];

const SLOW_THRESHOLD_MS = 1500;
const TIMEOUT_MS = 5000;

export async function GET(_request: NextRequest) {
  const results: ReachabilityItem[] = await Promise.all(
    TARGETS.map(async ({ url, label }): Promise<ReachabilityItem> => {
      const t0 = Date.now();
      try {
        const res = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: { "User-Agent": "OpsKitPro-NetworkCheck/1.0" },
        });
        const latencyMs = Date.now() - t0;
        // Consider reachable if HTTP response is received (any non-network-error status)
        const reachable = res.status < 600;
        const status: ReachabilityItem["status"] = !reachable
          ? "failed"
          : latencyMs > SLOW_THRESHOLD_MS
            ? "slow"
            : "ok";

        return { url, label, reachable, latencyMs, status };
      } catch {
        return {
          url,
          label,
          reachable: false,
          latencyMs: null,
          status: "failed",
        };
      }
    }),
  );

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
