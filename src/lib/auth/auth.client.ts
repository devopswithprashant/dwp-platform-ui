import { createClientLogger } from "../logging/client";
import type { AuthUser, LoginRequest, RegisterRequest } from "./types";
import { extractAccessToken, parseAuthUser } from "./types";
import {
  clearAccessTokenCookie,
  getClientAccessToken,
  setAccessTokenCookie,
} from "./token";

const logger = createClientLogger();

const getAuthBaseUrl = () =>
  process.env.NEXT_PUBLIC_AUTH_API_URL || "/api/v1/auth";

async function authFetch(
  operation: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${getAuthBaseUrl()}${path}`;
  const method = (init?.method || "GET").toUpperCase();
  const requestId =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);

  const started = Date.now();
  logger.debug({ "event.action": operation, "url.full": url, "http.request.method": method }, "http.request");

  try {
    const res = await fetch(url, { ...init, headers });
    const durationMs = Date.now() - started;
    const meta = {
      "event.action": operation,
      "url.full": url,
      "http.request.method": method,
      "http.response.status_code": res.status,
      "event.duration": durationMs * 1_000_000,
    };
    if (res.ok) logger.info(meta, "http.response");
    else logger.warn(meta, "http.response");
    return res;
  } catch (err) {
    logger.error(
      {
        "event.action": operation,
        "url.full": url,
        error: err instanceof Error ? { name: err.name, message: err.message } : err,
      },
      "http.error",
    );
    throw err;
  }
}

export async function registerUser(payload: RegisterRequest): Promise<void> {
  const res = await authFetch("register", "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Registration failed");
  }
}

export async function loginUser(payload: LoginRequest): Promise<void> {
  const res = await authFetch("login", "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Login failed");
  }

  const data = await res.json();
  const token = extractAccessToken(data);
  if (!token) {
    throw new Error("Login succeeded but no access token was returned");
  }

  setAccessTokenCookie(token);
}

export function logoutUser(): void {
  clearAccessTokenCookie();
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getClientAccessToken();
  if (!token) return null;

  const res = await authFetch("getMe", "/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAccessTokenCookie();
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const data = await res.json();
  return parseAuthUser(data);
}
