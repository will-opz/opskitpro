export function successResponse<T>({
  tool,
  input,
  result,
  startTime,
  extraHeaders,
}: {
  tool: string;
  input: Record<string, unknown>;
  result: T;
  startTime: number;
  extraHeaders?: HeadersInit;
}) {
  return Response.json(
    {
      ok: true,
      tool,
      input,
      result,
      meta: {
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        // Public read-only API only.
        // Do not use wildcard CORS for authenticated or user-specific APIs.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        ...((extraHeaders as any) || {}),
      },
    },
  );
}

export function errorResponse({
  tool,
  input,
  code,
  message,
  status = 400,
  startTime,
  extraHeaders,
}: {
  tool: string;
  input: Record<string, unknown>;
  code: string;
  message: string;
  status?: number;
  startTime: number;
  extraHeaders?: HeadersInit;
}) {
  return Response.json(
    {
      ok: false,
      tool,
      input,
      error: {
        code,
        message,
      },
      meta: {
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        // Public read-only API only.
        // Do not use wildcard CORS for authenticated or user-specific APIs.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        ...((extraHeaders as any) || {}),
      },
    },
  );
}
