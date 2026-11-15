import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminIdentity } from "@/lib/admin-auth";

function normalizeNextPath(value: string | null) {
  // URL parsing treats backslashes as authority separators.
  if (!value || !value.startsWith("/") || value.startsWith("//")
    || /[\\\u0000-\u0020]/.test(value)
    || value.startsWith("/api") || value.startsWith("/_next")) return "/admin";
  return value;
}

export async function GET(request: NextRequest) {
  const identity = await getAdminIdentity(request.headers);
  const response = identity.authenticated
    ? NextResponse.redirect(new URL(normalizeNextPath(request.nextUrl.searchParams.get("next")), request.url))
    : NextResponse.json({ error: "access_required" }, { status: 401 });
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 0, path: "/",
  });
  return response;
}
