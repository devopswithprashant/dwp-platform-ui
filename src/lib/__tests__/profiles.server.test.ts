const mockCookies = jest.fn();
const mockFetch = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

import { ACCESS_TOKEN_COOKIE } from "../auth/token";
import { getCurrentProfileUserId } from "../profiles.server";

describe("profiles.server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as typeof fetch;
    mockCookies.mockResolvedValue({
      get: () => ({ value: "header.payload.signature" }),
    });
  });

  it("gets the current user ID from the Profile Service /me endpoint", async () => {
    const userId = "8c0c0b42-ff2a-4d68-b90f-3b845ca8106a";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId }),
    });

    await expect(getCurrentProfileUserId()).resolves.toBe(userId);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profiles\/me$/);
    expect(init.cache).toBe("no-store");
    expect(new Headers(init.headers).get("Authorization")).toMatch(/^Bearer .+/);
    expect(ACCESS_TOKEN_COOKIE).toBe("access_token");
  });
});
