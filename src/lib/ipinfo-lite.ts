import "server-only";

import { isIP } from "node:net";
import { access } from "node:fs/promises";
import maxmind, { type Reader, type Response } from "maxmind";

const DEFAULT_MMDB_PATH = "/var/lib/opskitpro/ipinfo/ipinfo_lite.mmdb";

export interface IpinfoLiteRecord {
  asn?: string;
  as_name?: string;
  as_domain?: string;
  country?: string;
  country_code?: string;
  continent?: string;
  continent_code?: string;
}

export interface IpinfoLiteData {
  ip: string;
  asn: string;
  asName: string;
  asDomain: string;
  country: string;
  countryCode: string;
  continent: string;
  continentCode: string;
}

export type IpinfoLiteLookupResult =
  | { ok: true; data: IpinfoLiteData }
  | {
      ok: false;
      errorCode: "invalid_ip" | "database_unavailable" | "not_found";
      error: string;
    };

let readerPromise: Promise<Reader<Response>> | null = null;
let readerPath: string | null = null;

export function getIpinfoLitePath() {
  return process.env.IPINFO_MMDB_PATH || DEFAULT_MMDB_PATH;
}

export function mapIpinfoLiteRecord(
  ip: string,
  record: IpinfoLiteRecord,
): IpinfoLiteData {
  return {
    ip,
    asn: record.asn || "",
    asName: record.as_name || "Unknown",
    asDomain: record.as_domain || "",
    country: record.country || "Unknown",
    countryCode: record.country_code || "",
    continent: record.continent || "Unknown",
    continentCode: record.continent_code || "",
  };
}

async function getReader(path: string) {
  if (!readerPromise || readerPath !== path) {
    readerPath = path;
    readerPromise = access(path).then(() =>
      maxmind.open<Response>(path, {
        watchForUpdates: true,
        watchForUpdatesNonPersistent: true,
      }),
    );
    readerPromise.catch(() => {
      if (readerPath === path) {
        readerPromise = null;
        readerPath = null;
      }
    });
  }
  return readerPromise;
}

export async function lookupIpinfoLite(
  ip: string,
): Promise<IpinfoLiteLookupResult> {
  if (!isIP(ip)) {
    return {
      ok: false,
      errorCode: "invalid_ip",
      error: "A valid IPv4 or IPv6 address is required.",
    };
  }

  try {
    const reader = await getReader(getIpinfoLitePath());
    const record = reader.get(ip) as IpinfoLiteRecord | null;
    if (!record) {
      return {
        ok: false,
        errorCode: "not_found",
        error: "The local IPinfo Lite database has no record for this IP.",
      };
    }
    return { ok: true, data: mapIpinfoLiteRecord(ip, record) };
  } catch {
    return {
      ok: false,
      errorCode: "database_unavailable",
      error: "The local IPinfo Lite database is unavailable.",
    };
  }
}
