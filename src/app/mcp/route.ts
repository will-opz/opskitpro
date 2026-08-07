import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createOpsKitMcpServer } from "@/lib/mcp/website-check";

export const dynamic = "force-dynamic";

const allowedHosts = new Set([
  "opskitpro.com",
  "www.opskitpro.com",
  "localhost",
  "127.0.0.1",
]);

function validateRequestBoundary(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const rawHost = forwardedHost || request.headers.get("host") || new URL(request.url).host;
  const hostname = rawHost.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
  if (!allowedHosts.has(hostname)) {
    return Response.json(
      { error: "Invalid MCP host." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).hostname.toLowerCase();
      if (!allowedHosts.has(originHost)) {
        return Response.json(
          { error: "Invalid MCP origin." },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    } catch {
      return Response.json(
        { error: "Invalid MCP origin." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  return null;
}

async function handleMcpRequest(request: Request) {
  const boundaryError = validateRequestBoundary(request);
  if (boundaryError) return boundaryError;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createOpsKitMcpServer(request);
  await server.connect(transport);

  const response = await transport.handleRequest(request);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}

export function OPTIONS(request: Request) {
  const boundaryError = validateRequestBoundary(request);
  if (boundaryError) return boundaryError;

  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
      "Cache-Control": "no-store",
    },
  });
}
