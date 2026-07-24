import type { NextRequest } from "next/server";
import { handleCliDiagnostic } from "@/lib/cli-diagnostic";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return handleCliDiagnostic(request);
}
