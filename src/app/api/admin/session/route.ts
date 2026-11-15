import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, ACCESS_LOGOUT_PATH, getAdminIdentity, isAdminConfigured } from "@/lib/admin-auth";

function sessionResponse(body: unknown, status = 200) {
  const response = NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Cf-Access-Jwt-Assertion" },
  });
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 0, path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const identity = await getAdminIdentity(request.headers);
  return sessionResponse({
    ...identity,
    configured: isAdminConfigured(),
    passwordConfigured: false,
    accessConfigured: isAdminConfigured(),
  });
}

export async function POST() {
  // Retired password fallback must not become an Access bypass.
  return sessionResponse({ authenticated: false, error: "access_required" }, 403);
}

export async function DELETE() {
  // Clearing a local cookie does not end Access SSO; the client must navigate.
  return sessionResponse({ authenticated: false, logoutUrl: ACCESS_LOGOUT_PATH });
}
