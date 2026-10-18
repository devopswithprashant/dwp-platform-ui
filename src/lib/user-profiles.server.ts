import "server-only";

import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "./auth/token";
import type { BlogMetadata } from "./types";
import { serverLogger } from "./logging/server";

export interface PublicUserProfile {
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getUserApiBaseUrl(): string {
  const host = process.env.USER_SERVICE_HOST || "localhost";
  const port = process.env.USER_SERVICE_PORT || "8080";
  return `http://${host}:${port}/api/v1/users`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parsePublicProfile(value: unknown): PublicUserProfile | null {
  if (
    !isRecord(value) ||
    typeof value.userId !== "string" ||
    !UUID_PATTERN.test(value.userId) ||
    !(value.displayName === null || typeof value.displayName === "string") ||
    !(value.bio === null || typeof value.bio === "string") ||
    !(value.avatarUrl === null || typeof value.avatarUrl === "string") ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }

  return {
    userId: value.userId,
    displayName: value.displayName,
    bio: value.bio,
    avatarUrl: value.avatarUrl,
    createdAt: value.createdAt,
  };
}

export async function getCurrentProfileUserId(): Promise<string | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${getUserApiBaseUrl()}/me`, {
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

export async function fetchPublicUserProfile(
  userId: string,
): Promise<PublicUserProfile | null> {
  if (!UUID_PATTERN.test(userId)) return null;

  try {
    const response = await fetch(`${getUserApiBaseUrl()}/${encodeURIComponent(userId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const profile = parsePublicProfile(await response.json());
    return profile?.userId === userId ? profile : null;
  } catch (error) {
    serverLogger.warn(
      {
        "event.action": "fetchPublicUserProfile",
        "event.outcome": "failure",
        error: error instanceof Error ? { name: error.name, message: error.message } : error,
      },
      "profile.lookup.failed",
    );
    return null;
  }
}

export async function fetchBlogAuthorProfiles(
  blogs: BlogMetadata[],
): Promise<Map<string, PublicUserProfile>> {
  const ids = [...new Set(
    blogs
      .map((blog) => blog.authorUuid)
      .filter((id): id is string => typeof id === "string" && UUID_PATTERN.test(id)),
  )];
  const profiles = new Map<string, PublicUserProfile>();
  const concurrency = 4;

  for (let index = 0; index < ids.length; index += concurrency) {
    const batch = ids.slice(index, index + concurrency);
    const results = await Promise.all(
      batch.map(async (id) => [id, await fetchPublicUserProfile(id)] as const),
    );
    for (const [id, profile] of results) {
      if (profile) profiles.set(id, profile);
    }
  }

  return profiles;
}
