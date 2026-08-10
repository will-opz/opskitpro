import { NextRequest, NextResponse } from "next/server";
import type { IpLookupResponse } from "@/lib/api-contracts";
import {
  getClientIp,
  getRequestCloudflareMetadata,
} from "@/lib/runtime-context";
import { lookupIpinfoLite } from "@/lib/ipinfo-lite";

// export const runtime = 'edge' // Removed to avoid 500 errors on OpenNext Node.js runtime
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetIp = searchParams.get("q");

  const buildFallbackResponse = (
    ip: string,
    provider: string,
    source: IpLookupResponse["_source"],
  ) =>
    ({
      ip,
      country: "Unknown",
      country_name: "Unknown",
      country_code: "",
      region: "Unknown",
      city: "Unknown",
      latitude: "",
      longitude: "",
      lat: "",
      lon: "",
      org: "Unknown",
      isp: "Unknown",
      asn: "",
      timezone: "UTC",
      network_type: "Unknown",
      proxy: false,
      provider,
      _source: source,
    }) satisfies IpLookupResponse;

  const fetchLocalData = async (queryIp: string) => {
    const result = await lookupIpinfoLite(queryIp);
    return result.ok ? result.data : null;
  };

  // 1. Feature: Support querying a specified IP
  if (targetIp) {
    const localData = await lookupIpinfoLite(targetIp);
    if (localData.ok) {
      const data = localData.data;
      return NextResponse.json({
        ip: data.ip,
        country: data.country,
        country_name: data.country,
        country_code: data.countryCode,
        region: "Unknown",
        city: "Unknown",
        latitude: "",
        longitude: "",
        lat: "",
        lon: "",
        org: data.asName,
        isp: data.asName,
        asn: data.asn,
        as_domain: data.asDomain,
        continent: data.continent,
        continent_code: data.continentCode,
        timezone: "Unknown",
        network_type: "Unknown",
        proxy: false,
        proxy_known: false,
        provider: "IPinfo Lite",
        _source: "ipinfo-lite",
        data_notice:
          "Country-level geolocation and ASN data only. City, coordinates, timezone, network type, and proxy status are not provided by IPinfo Lite.",
      } satisfies IpLookupResponse);
    }
    return NextResponse.json(
      {
        ...buildFallbackResponse(targetIp, "IPinfo Lite", "ipinfo-lite"),
        proxy_known: false,
        data_notice: localData.error,
      },
      { status: localData.errorCode === "invalid_ip" ? 400 : 200 },
    );
  }

  // 2. Feature: Current User Info using Cloudflare (getCloudflareContext)
  const ip = getClientIp(request);

  const buildCloudflareResponse = (cf: any) =>
    NextResponse.json({
      ip,
      country: cf.country || "Unknown",
      country_name: cf.country || "N/A",
      country_code: cf.country || "",
      region: cf.region || cf.regionCode || "N/A",
      city: cf.city || "N/A",
      latitude: cf.latitude || "",
      longitude: cf.longitude || "",
      lat: cf.latitude || "",
      lon: cf.longitude || "",
      org: cf.asOrganization || "N/A",
      isp: cf.asOrganization || "N/A",
      asn: cf.asn || "",
      timezone: cf.timezone || "UTC",
      // Cloudflare does not expose a direct hosting/residential flag; leave as unknown
      network_type: "Unknown",
      proxy: false,
      proxy_known: false,
      provider: "Cloudflare Edge",
      _source: "cloudflare-context",
    } satisfies IpLookupResponse);

  const requestCf = getRequestCloudflareMetadata(request);
  if (requestCf) {
    return buildCloudflareResponse(requestCf);
  }

  // Fallback for local development and standard Node.js server deployments.
  const fallbackData = await fetchLocalData(ip);
  if (fallbackData) {
    return NextResponse.json({
      ip: fallbackData.ip,
      country: fallbackData.country,
      country_name: fallbackData.country,
      country_code: fallbackData.countryCode,
      region: "Unknown",
      city: "Unknown",
      latitude: "",
      longitude: "",
      lat: "",
      lon: "",
      org: fallbackData.asName,
      isp: fallbackData.asName,
      asn: fallbackData.asn,
      as_domain: fallbackData.asDomain,
      continent: fallbackData.continent,
      continent_code: fallbackData.continentCode,
      timezone: "Unknown",
      network_type: "Unknown",
      proxy: false,
      proxy_known: false,
      provider: "IPinfo Lite",
      _source: "ipinfo-lite",
      data_notice:
        "Country-level geolocation and ASN data only. City, coordinates, timezone, network type, and proxy status are not provided by IPinfo Lite.",
    } satisfies IpLookupResponse);
  }

  return NextResponse.json(
    buildFallbackResponse(ip, "Node Proxy Fallback", "cloudflare-edge-default"),
  );
}
