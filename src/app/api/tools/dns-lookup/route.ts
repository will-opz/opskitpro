import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/validators";
import { performDnsLookup } from "@/lib/tools/dns";
import { getClientIp } from "@/lib/runtime-context";

export const dynamic = "force-dynamic";

const DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9_](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIp(request);

  if (!checkRateLimit(ip)) {
    return errorResponse({
      tool: "dns-lookup",
      input: {},
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later.",
      status: 429,
      startTime,
    });
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const type = (searchParams.get("type") || "all").toUpperCase();

  if (!domain) {
    return errorResponse({
      tool: "dns-lookup",
      input: { domain: null },
      code: "MISSING_PARAM",
      message: 'The "domain" parameter is required.',
      status: 400,
      startTime,
    });
  }

  if (!DOMAIN_REGEX.test(domain)) {
    return errorResponse({
      tool: "dns-lookup",
      input: { domain },
      code: "INVALID_DOMAIN",
      message: "Invalid domain format.",
      status: 400,
      startTime,
    });
  }

  try {
    const result = await performDnsLookup(domain, type);
    return successResponse({
      tool: "dns-lookup",
      input: { domain, type: type.toLowerCase() },
      result: result.records,
      startTime,
    });
  } catch (error: any) {
    return errorResponse({
      tool: "dns-lookup",
      input: { domain, type: type.toLowerCase() },
      code: "LOOKUP_FAILED",
      message: error.message || "DNS lookup failed.",
      status: 500,
      startTime,
    });
  }
}
