import type { Logger } from "./types";

let cached: Logger | null = null;

export async function getLogger(): Promise<Logger> {
  if (cached) return cached;

  if (typeof window !== "undefined") {
    const mod = await import("./client");
    cached = mod.createClientLogger();
    return cached;
  }

  const mod = await import("./server");
  cached = mod.serverLogger;
  return cached;
}

