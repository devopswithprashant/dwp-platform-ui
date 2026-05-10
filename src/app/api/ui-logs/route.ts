import { NextResponse } from "next/server";
import { serverLogger } from "@/lib/logging/server";

type ClientLogPayload = {
  level?: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
  msg?: string;
  bindings?: Record<string, unknown>;
  ts?: string;
};

export async function POST(req: Request) {
  // Minimal endpoint so you can optionally forward browser logs in prod later.
  // Safe default: accept but only log warn+ in production (to reduce noise).
  let body: ClientLogPayload | null = null;
  try {
    body = (await req.json()) as ClientLogPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const level = body.level ?? "info";
  const msg = body.msg ?? "client.log";
  const bindings = {
    ...body.bindings,
    runtime: "browser",
    receivedAt: new Date().toISOString(),
  };

  const prod = process.env.NODE_ENV === "production";
  const shouldLog =
    !prod || level === "fatal" || level === "error" || level === "warn";

  if (shouldLog) {
    const fn =
      level === "fatal"
        ? serverLogger.fatal
        : level === "error"
          ? serverLogger.error
          : level === "warn"
            ? serverLogger.warn
            : level === "debug"
              ? serverLogger.debug
              : level === "trace"
                ? serverLogger.trace
                : serverLogger.info;

    fn({ ...bindings, ts: body.ts }, msg);
  }

  return NextResponse.json({ ok: true });
}

