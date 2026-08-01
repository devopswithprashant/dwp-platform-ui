export const ACCESS_TOKEN_COOKIE = "access_token";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function setAccessTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=${MAX_AGE_SECONDS}`;
}

export function clearAccessTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0`;
}

export function getAccessTokenFromCookieHeader(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const prefix = `${ACCESS_TOKEN_COOKIE}=`;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function getClientAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  return getAccessTokenFromCookieHeader(document.cookie);
}
