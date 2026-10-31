import {
  BlogServiceError,
  createBlog,
  deleteBlog,
  publishBlog,
  updateBlog,
} from "../api.client";
import { ACCESS_TOKEN_COOKIE } from "../auth/token";

describe("authenticated blog write requests", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    global.fetch = mockFetch as typeof fetch;
  });

  it("creates a post without client-supplied author identity", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => 42,
    });

    await expect(createBlog({ title: "A post", markdown: "# Content" })).resolves.toBe(42);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/blogs");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer header.payload.signature",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      title: "A post",
      markdown: "# Content",
    });
  });

  it("sends bearer credentials for update and delete", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    await updateBlog(42, { title: "Updated", markdown: "# Updated" });
    await deleteBlog(42);

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "/api/blogs/42",
      expect.objectContaining({
        method: "PUT",
        headers: expect.any(Headers),
      }),
    );
    expect(new Headers((mockFetch.mock.calls[0] as [string, RequestInit])[1].headers)
      .get("Authorization")).toBe("Bearer header.payload.signature");
    expect(new Headers((mockFetch.mock.calls[1] as [string, RequestInit])[1].headers)
      .get("Authorization")).toBe("Bearer header.payload.signature");
  });

  it("publishes a post through the publish endpoint with bearer credentials", async () => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    await publishBlog(42);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/blogs/42/publish",
      expect.objectContaining({ method: "POST", headers: expect.any(Headers) }),
    );
    expect(new Headers((mockFetch.mock.calls[0] as [string, RequestInit])[1].headers)
      .get("Authorization")).toMatch(/^Bearer /);
  });

  it("does not send a write without a signed-in token", async () => {
    await expect(deleteBlog(42)).rejects.toMatchObject({ status: 401 });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    [401, "Your session has expired. Please sign in again."],
    [403, "You do not have permission to manage this blog."],
    [404, "This blog could not be found."],
  ])("retains the Blog Service %i status for ownership handling", async (status, message) => {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=header.payload.signature; path=/`;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      text: async () => "",
    });

    await expect(deleteBlog(42)).rejects.toEqual(
      expect.objectContaining<Partial<BlogServiceError>>({ status, message }),
    );
  });
});
