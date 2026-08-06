import { buildLlmsTxt, createStableEtag } from "@/lib/tool-discovery";

export const dynamic = "force-dynamic";

const cacheControl = "public, max-age=3600, stale-while-revalidate=86400";

export function GET(request: Request) {
  const body = buildLlmsTxt();
  const etag = createStableEtag(body);
  const headers = {
    "Cache-Control": cacheControl,
    ETag: etag,
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, {
    headers: {
      ...headers,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
