import { NextResponse } from "next/server";

import {
  getMetricsContentType,
  getMetricsPayload,
} from "@/lib/metrics/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = await getMetricsPayload();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": getMetricsContentType(),
      "Cache-Control": "no-store",
    },
  });
}
