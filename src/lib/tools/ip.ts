import { lookupIpinfoLite } from "@/lib/ipinfo-lite";

export async function performIpLookup(ip: string) {
  const result = await lookupIpinfoLite(ip);
  if (!result.ok) {
    if (result.errorCode === "invalid_ip") throw new Error(result.error);
    return {
      ip,
      country: "Unknown",
      countryCode: "",
      region: "Unknown",
      city: "Unknown",
      latitude: null,
      longitude: null,
      isp: "Unknown",
      asn: "",
      timezone: "Unknown",
      isDataCenter: null,
      isProxy: null,
      provider: "IPinfo Lite",
      source: "ipinfo-lite",
      dataNotice: result.error,
    };
  }

  const data = result.data;
  return {
    ip,
    country: data.country,
    countryCode: data.countryCode,
    region: "Unknown",
    city: "Unknown",
    latitude: null,
    longitude: null,
    isp: data.asName,
    asn: data.asn,
    asDomain: data.asDomain,
    continent: data.continent,
    continentCode: data.continentCode,
    timezone: "Unknown",
    isDataCenter: null,
    isProxy: null,
    provider: "IPinfo Lite",
    source: "ipinfo-lite",
    dataNotice:
      "IPinfo Lite provides country-level geolocation and ASN data; city, coordinates, timezone, and proxy status are not included.",
  };
}
