import type { NextRequest } from "next/server";
import { handleCliDiagnostic } from "@/lib/cli-diagnostic";

export const dynamic = "force-dynamic";

export function GET(
  request: NextRequest,
  { params }: { params: { domain: string } },
) {
  return handleCliDiagnostic(request, params.domain);
}
