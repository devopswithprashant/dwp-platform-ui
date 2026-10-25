import "server-only";

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./auth/token";
import { serverLogger } from "./logging/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getProfileApiBaseUrl(): string {
  const host = process.env.PROFILE_SERVICE_HOST || "localhost";
  const port = process.env.PROFILE_SERVICE_PORT || "8080";
  return `http://${host}:${port}/api/v1/profiles`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function getCurrentProfileUserId(): Promise<string | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${getProfileApiBaseUrl()}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const profile: unknown = await response.json();
    if (!isRecord(profile) || typeof profile.userId !== "string") return null;
    return UUID_PATTERN.test(profile.userId) ? profile.userId : null;
  } catch (error) {
    serverLogger.warn(
      {
        "event.action": "getCurrentProfileUserId",
        error: error instanceof Error ? { name: error.name, message: error.message } : error,
      },
      "profile.lookup.failed",
    );
    return null;
  }
}
