import "server-only";

import { cookies } from "next/headers";
import type { AuthUser } from "./types";
import { parseAuthUser } from "./types";
import { ACCESS_TOKEN_COOKIE } from "./token";

const getAuthBaseUrl = () => {
  const host = process.env.AUTH_SERVICE_HOST || "localhost";
  const port = process.env.AUTH_SERVICE_PORT || "8081";
  return `http://${host}:${port}/api/v1/auth`;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${getAuthBaseUrl()}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return parseAuthUser(data);
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}
