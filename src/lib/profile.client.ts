import { createClientLogger } from "./logging/client";
import type { Profile } from "./profile.types";
import { clearAccessTokenCookie, getClientAccessToken } from "./auth/token";

const logger = createClientLogger();
const getProfileApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_PROFILE_API_URL || "/api/v1/profiles").replace(/\/+$/, "");

export interface ProfileUpdate {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  preferences: Record<string, unknown>;
  socialLinks: Record<string, unknown>;
}

export interface ProfileValidationDetail {
  field: string;
  message: string;
}

export class ProfileApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details: ProfileValidationDetail[] = [],
  ) {
    super(message);
    this.name = "ProfileApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseProfile(data: unknown): Profile {
  if (
    !isRecord(data) ||
    typeof data.userId !== "string" ||
    !data.userId ||
    !(data.displayName === null || typeof data.displayName === "string") ||
    !(data.bio === null || typeof data.bio === "string") ||
    !(data.avatarUrl === null || typeof data.avatarUrl === "string") ||
    !isRecord(data.preferences) ||
    !isRecord(data.socialLinks) ||
    typeof data.createdAt !== "string" ||
    typeof data.updatedAt !== "string"
  ) {
    throw new Error("The Profile Service returned an invalid profile");
  }

  return {
    userId: data.userId,
    displayName: data.displayName,
    bio: data.bio,
    avatarUrl: data.avatarUrl,
    preferences: data.preferences,
    socialLinks: data.socialLinks,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function readError(res: Response): Promise<ProfileApiError> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  const body = isRecord(data) ? data : {};
  const rawDetails = Array.isArray(body.details) ? body.details : [];
  const details = rawDetails.flatMap((detail) => {
    if (!isRecord(detail)) return [];
    if (typeof detail.field !== "string" || typeof detail.message !== "string") return [];
    return [{ field: detail.field, message: detail.message }];
  });
  const code = typeof body.error === "string" ? body.error : undefined;
  const message =
    typeof body.message === "string"
      ? body.message
      : res.status === 404
        ? "Your profile could not be found."
        : res.status === 401
          ? "Your session has expired. Please sign in again."
          : "The profile request could not be completed.";

  return new ProfileApiError(message, res.status, code, details);
}

async function requestProfile(
  method: "GET" | "PUT",
  update?: ProfileUpdate,
): Promise<Profile> {
  const token = getClientAccessToken();
  if (!token) {
    throw new ProfileApiError(
      "You must sign in to view your profile.",
      401,
      "unauthorized",
    );
  }

  const url = `${getProfileApiBaseUrl()}/me`;
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (update) headers.set("Content-Type", "application/json");

  const requestId =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  headers.set("x-request-id", requestId);

  const started = Date.now();
  logger.debug(
    { "event.action": method === "GET" ? "getProfile" : "updateProfile", "http.request.method": method },
    "http.request",
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      ...(update ? { body: JSON.stringify(update) } : {}),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (err) {
    logger.error(
      {
        "event.action": method === "GET" ? "getProfile" : "updateProfile",
        error: err instanceof Error ? { name: err.name, message: err.message } : err,
      },
      "http.error",
    );
    throw err;
  }

  const meta = {
    "event.action": method === "GET" ? "getProfile" : "updateProfile",
    "http.request.method": method,
    "http.response.status_code": res.status,
    "event.duration": (Date.now() - started) * 1_000_000,
  };
  if (res.ok) logger.info(meta, "http.response");
  else logger.warn(meta, "http.response");

  if (res.status === 401) clearAccessTokenCookie();
  if (!res.ok) throw await readError(res);
  return parseProfile(await res.json());
}

export function fetchProfile(): Promise<Profile> {
  return requestProfile("GET");
}

export function updateProfile(update: ProfileUpdate): Promise<Profile> {
  return requestProfile("PUT", update);
}
