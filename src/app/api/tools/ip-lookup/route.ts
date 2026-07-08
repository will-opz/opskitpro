import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/validators";
import { performIpLookup } from "@/lib/tools/ip";
import {
  getClientIp,
  getRequestCloudflareMetadata,
} from "@/lib/runtime-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestIp = getClientIp(request);

  if (!checkRateLimit(requestIp)) {
    return errorResponse({
      tool: "ip-lookup",
      input: {},
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later.",
      status: 429,
      startTime,
    });
  }

  const { searchParams } = new URL(request.url);
  const queryIp = searchParams.get("ip");

  try {
    let result: any;

    if (queryIp) {
      result = await performIpLookup(queryIp);
    } else {
      // Use the Cloudflare context from the request if targeting self and CF is available
      const cf = getRequestCloudflareMetadata(request);
      if (cf && cf.country) {
        result = {
          ip: requestIp,
          country: cf.country || "Unknown",
          countryCode: cf.country || "",
          region: cf.region || cf.regionCode || "Unknown",
          city: cf.city || "Unknown",
          latitude: cf.latitude || 0,
          longitude: cf.longitude || 0,
          isp: cf.asOrganization || "Unknown",
          asn: cf.asn || "",
          timezone: cf.timezone || "UTC",
          isDataCenter: false, // Cloudflare edge doesn't reliably expose this info
          isProxy: false,
        };
      } else {
        result = await performIpLookup(requestIp);
      }
    }

    return successResponse({
      tool: "ip-lookup",
      input: queryIp ? { ip: queryIp } : {},
      result,
      startTime,
    });
  } catch (error: any) {
    return errorResponse({
      tool: "ip-lookup",
      input: queryIp ? { ip: queryIp } : {},
      code: "LOOKUP_FAILED",
      message: error.message || "IP lookup failed.",
      status: 500,
      startTime,
    });
  }
}
