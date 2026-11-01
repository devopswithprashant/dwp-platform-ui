const mockCookies = jest.fn();
const mockFetch = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));
jest.mock("../logging/server", () => ({
  serverLogger: { warn: jest.fn() },
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

  it("does not make a request when the auth cookie is absent", async () => {
    mockCookies.mockResolvedValueOnce({ get: () => undefined });

    await expect(getCurrentProfileUserId()).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    { ok: false, json: async () => ({}) },
    { ok: true, json: async () => null },
    { ok: true, json: async () => [] },
    { ok: true, json: async () => ({ userId: 7 }) },
    { ok: true, json: async () => ({ userId: "not-a-uuid" }) },
  ])("returns null for unavailable or invalid profile responses", async (response) => {
    mockFetch.mockResolvedValueOnce(response);
    await expect(getCurrentProfileUserId()).resolves.toBeNull();
  });

  it("logs network failures and returns null", async () => {
    const { serverLogger } = jest.requireMock("../logging/server") as {
      serverLogger: { warn: jest.Mock };
    };
    mockFetch.mockRejectedValueOnce(new Error("profile service unavailable"));

    await expect(getCurrentProfileUserId()).resolves.toBeNull();
    expect(serverLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: { name: "Error", message: "profile service unavailable" },
      }),
      "profile.lookup.failed",
    );
  });
});
