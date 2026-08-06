import {
  buildToolManifest,
  createStableEtag,
} from "@/lib/tool-discovery";

export const dynamic = "force-dynamic";

const cacheControl = "public, max-age=3600, stale-while-revalidate=86400";

export function GET(request: Request) {
  const body = JSON.stringify(buildToolManifest());
  const etag = createStableEtag(body);
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": cacheControl,
    ETag: etag,
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, {
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
