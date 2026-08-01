export interface AuthUser {
  id: number | string;
  username: string;
  email: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export function extractAccessToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const queue: unknown[] = [data];
  const seen = new Set<unknown>();
  const tokenKeys = ["accessToken", "access_token", "token", "jwt"];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    const obj = current as Record<string, unknown>;
    for (const key of tokenKeys) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }

    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

export function parseAuthUser(data: unknown): AuthUser | null {
  if (!data || typeof data !== "object") return null;

  const queue: unknown[] = [data];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    const obj = current as Record<string, unknown>;
    const rawId = obj.id;
    const id = typeof rawId === "number"
      ? rawId
      : typeof rawId === "string" && rawId.trim()
        ? rawId
        : null;
    const username = typeof obj.username === "string" ? obj.username.trim() : "";
    const email = typeof obj.email === "string" ? obj.email.trim() : "";

    if (id !== null && username) {
      return { id, username, email };
    }

    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}
