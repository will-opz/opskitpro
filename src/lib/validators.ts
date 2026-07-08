import ipaddr from "ipaddr.js";
import dns from "dns/promises";


export function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    // Only allow http and https
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    // Restrict unusual ports for MVP to reduce SSRF scanning risk.
    if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if an IP is a private/local IP address.
 */
export function isPrivateIp(ip: string): boolean {
  try {
    const addr = ipaddr.parse(ip);
    const range = addr.range();

    // Unicast range means it's a normal public IP.
    if (range === "unicast") return false;

    // Everything else (private, loopback, linkLocal, multicast, etc.) is blocked.
    return true;
  } catch {
    // If it can't be parsed, assume it's unsafe.
    return true;
  }
}

/**
 * Validates a URL against SSRF attacks.
 * Resolves the domain to ensure it doesn't point to a local/private IP.
 */
export async function validateSSRF(
  urlStr: string,
): Promise<{ safe: boolean; ip?: string; error?: string }> {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;

    // First check if the hostname itself is a private IP.
    // Node's URL constructor normalizes obfuscated IPs like '0177.0.0.1' or '2130706433' or '127.1' into standard notation.
    if (ipaddr.isValid(hostname)) {
      if (isPrivateIp(hostname)) {
        return { safe: false, error: "Private IP addresses are not allowed." };
      }
      return { safe: true, ip: hostname };
    }

    // Resolve domain to IP
    const records = await dns.resolve(hostname);
    if (!records || records.length === 0) {
      return { safe: false, error: "Could not resolve domain." };
    }

    // Check all resolved IPs to ensure none are private.
    for (const ip of records) {
      if (isPrivateIp(ip)) {
        return {
          safe: false,
          error: "Domain resolves to a private IP address.",
        };
      }
    }

    return { safe: true, ip: records[0] };
  } catch (err: any) {
    return {
      safe: false,
      error: err.message || "Invalid URL or DNS resolution failed.",
    };
  }
}
