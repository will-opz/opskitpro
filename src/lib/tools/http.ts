import { validateSSRF } from "../validators";

const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

export async function performHttpCheck(urlStr: string) {
  let currentUrl = urlStr;
  let redirectCount = 0;
  const redirectChain: string[] = [];

  const t0 = Date.now();
  let finalResponse: Response | null = null;

  while (redirectCount <= MAX_REDIRECTS) {
    // 1. Double Validation (Pre-fetch SSRF check)
    const ssrfCheck = await validateSSRF(currentUrl);
    if (!ssrfCheck.safe) {
      throw new Error(`Security Exception: ${ssrfCheck.error}`);
    }

    try {
      // 2. Fetch with manual redirects
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(5000), // 5 seconds per hop
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (OpsKitPro-HttpCheck/1.0)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      finalResponse = response;

      // 3. Prevent downloading large bodies: immediately cancel the body stream since we only need headers/status
      if (response.body) {
        await response.body.cancel();
      }

      // 4. Handle redirects
      if (REDIRECT_STATUS.has(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          // Redirect status but no location, stop here
          break;
        }

        // Resolve relative paths correctly
        const nextUrl = new URL(location, currentUrl).toString();
        redirectChain.push(nextUrl);

        currentUrl = nextUrl;
        redirectCount++;
        continue;
      }

      // Not a redirect, stop here
      break;
    } catch (err: any) {
      throw new Error(`HTTP Fetch Failed on ${currentUrl}: ${err.message}`);
    }
  }

  if (redirectCount > MAX_REDIRECTS) {
    throw new Error("Security Exception: TOO_MANY_REDIRECTS");
  }

  if (!finalResponse) {
    throw new Error("HTTP Fetch Failed: No response received");
  }

  const durationMs = Date.now() - t0;

  const headers: Record<string, string> = {};
  finalResponse.headers.forEach((val, key) => {
    headers[key.toLowerCase()] = val;
  });

  return {
    status: finalResponse.status,
    statusText: finalResponse.statusText,
    finalUrl: currentUrl,
    redirectChain,
    redirected: redirectCount > 0,
    durationMs,
    server: headers["server"] || "Unknown",
    contentType: headers["content-type"] || "Unknown",
    headers,
  };
}
