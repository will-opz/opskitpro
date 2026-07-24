import type { NextRequest } from "next/server";
import { handleCliDiagnostic } from "@/lib/cli-diagnostic";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  return handleCliDiagnostic(request, (await params).domain);
}
