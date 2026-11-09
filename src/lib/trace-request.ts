import dns from "node:dns/promises";
import https from "node:https";
import { checkServerIdentity } from "node:tls";
import { isPrivateIp } from "./validators";
import { TRACE_MAX_BYTES } from "./cloudflare-trace";
import { withinBudget } from "./request-budget";

/** Resolve once and pin the connection; use the shared public-address policy for every answer. */
export async function requestTargetTrace(domain: string, signal: AbortSignal): Promise<{ status: number; text: string }> {
  const records = await withinBudget(dns.lookup(domain, { all: true }), 5000, signal);
  if (!records.length) throw new Error("unreachable");
  if (records.some(record => isPrivateIp(record.address))) throw new Error("blocked");
  signal.throwIfAborted();
  const address = records.find(record => record.family === 4) ?? records[0];
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: address.address, family: address.family, port: 443,
      servername: domain, method: "GET", path: "/cdn-cgi/trace", signal,
      headers: { Host: domain, Accept: "text/plain", "User-Agent": "OpsKitPro-Trace-Client/1.0" },
      checkServerIdentity: (_hostname, certificate) => checkServerIdentity(domain, certificate),
    }, response => {
      const status = response.statusCode ?? 502;
      if (status !== 200) { response.resume(); resolve({ status, text: "" }); request.destroy(); return; }
      const chunks: Buffer[] = []; let bytes = 0;
      response.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > TRACE_MAX_BYTES) { request.destroy(new Error("invalid_response")); return; }
        chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => resolve({ status, text: Buffer.concat(chunks).toString("utf8") }));
    });
    request.on("error", reject);
    request.end();
  });
}
