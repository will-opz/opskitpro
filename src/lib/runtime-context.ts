import type { NextRequest } from "next/server";

type CloudflareRuntimeContext = {
  cf?: Record<string, any>;
  env?: Record<string, any>;
};

/**
 * Extracts the client IP from the request.
 * SECURITY BOUNDARY: This function inherently trusts `cf-connecting-ip` and `x-forwarded-for`.
 * It is only safe to use because OpsKitPro is deployed behind Cloudflare and an Nginx reverse proxy,
 * which strip or overwrite these headers from malicious direct external requests.
 */
export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    (request as any).ip ||
    "127.0.0.1"
  );
}

export function getRequestCloudflareMetadata(request: NextRequest) {
  const cf = (request as any).cf;
  return cf && Object.keys(cf).length > 0 ? cf : null;
}

export async function getCloudflareRuntimeContext(): Promise<CloudflareRuntimeContext> {
  return {};
}
