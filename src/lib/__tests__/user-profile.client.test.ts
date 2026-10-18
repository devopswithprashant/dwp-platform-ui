import {
  fetchUserProfile,
  updateUserProfile,
} from "../user-profile.client";
import { ACCESS_TOKEN_COOKIE } from "../auth/token";

describe("user-profile.client", () => {
  const mockFetch = jest.fn();

  const profile = {
    userId: "8c0c0b42-ff2a-4d68-b90f-3b845ca8106a",
    displayName: "Ada",
    bio: "Engineer",
    avatarUrl: null,
    preferences: { theme: "dark", custom: { enabled: true } },
    socialLinks: { website: "https://example.test" },
    createdAt: "2026-10-18T12:00:00Z",
    updatedAt: "2026-10-18T12:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    global.fetch = mockFetch as typeof fetch;
  });

  it("gets the signed-in user's profile with the bearer token", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => profile,
    });

    await expect(fetchUserProfile()).resolves.toEqual(profile);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/users/me");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer header.payload.signature",
    );
    expect(init).toEqual(expect.objectContaining({
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    }));
  });

  it("submits every mutable field on profile replacement", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    const update = {
      displayName: null,
      bio: "Updated",
      avatarUrl: null,
      preferences: { theme: "light", custom: { enabled: true } },
      socialLinks: {},
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...profile, ...update }),
    });

    await updateUserProfile(update);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/users/me",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(update),
      }),
    );
  });

  it("does not call the service without a token", async () => {
    await expect(fetchUserProfile()).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("clears the token and reports an expired session", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

    await expect(fetchUserProfile()).rejects.toMatchObject({ status: 401 });
    expect(document.cookie).not.toContain(ACCESS_TOKEN_COOKIE);
  });

  it("reports a missing profile and structured validation details", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: "profile_not_found" }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "invalid_update",
          details: [{ field: "displayName", message: "must be at most 100 characters" }],
        }),
      });

    await expect(fetchUserProfile()).rejects.toMatchObject({
      status: 404,
      code: "profile_not_found",
    });
    await expect(updateUserProfile({
      displayName: "a".repeat(101),
      bio: null,
      avatarUrl: null,
      preferences: {},
      socialLinks: {},
    })).rejects.toEqual(expect.objectContaining({
      status: 400,
      details: [{ field: "displayName", message: "must be at most 100 characters" }],
    }));
  });
});
