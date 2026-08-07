import type { NextRequest } from "next/server";

import {
  GET as diagnosticGet,
  POST as diagnosticPost,
} from "@/lib/diagnostic-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest | Request) {
  return diagnosticGet(request);
}

export async function POST(request: Request) {
  return diagnosticPost(request);
}
