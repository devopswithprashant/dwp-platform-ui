const mockCookies = jest.fn();
const mockFetch = jest.fn();
const mockRecordHttpClientMetrics = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));
jest.mock("../logging/server", () => ({
  serverLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("../metrics/httpClient", () => ({
  recordHttpClientMetrics: (...args: unknown[]) => mockRecordHttpClientMetrics(...args),
}));

import {
  BlogServiceError,
  createBlog,
  deleteBlog,
  fetchBlogContent,
  fetchBlogs,
  updateBlog,
} from "../api.server";
import { serverLogger } from "../logging/server";

describe("server Blog API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as typeof fetch;
    mockCookies.mockResolvedValue({
      get: () => ({ value: "header.payload.signature" }),
    });
    delete process.env.BACKEND_SERVICE_HOST;
    delete process.env.BACKEND_SERVICE_PORT;
  });

  it("loads arrays and paginated lists from the backend", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1 }] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ content: [{ id: 2 }] }) });

    await expect(fetchBlogs()).resolves.toEqual([{ id: 1 }]);
    await expect(fetchBlogs()).resolves.toEqual([{ id: 2 }]);
    expect(mockFetch).toHaveBeenNthCalledWith(1, "http://blog-service:8080/api/blogs");
  });

  it("throws when blog metadata or content cannot be fetched", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false });

    await expect(fetchBlogs()).rejects.toThrow("Failed to fetch blogs");
    await expect(fetchBlogContent(7)).rejects.toThrow("Blog not found");
  });

  it("fetches content and accepts numeric or object create IDs", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ postId: 7, content: "# Body", format: "MARKDOWN" }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => 7 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 8 }) });

    await expect(fetchBlogContent(7)).resolves.toMatchObject({ content: "# Body" });
    await expect(createBlog({ title: "Post", markdown: "# Body" })).resolves.toBe(7);
    await expect(createBlog({ title: "Post", markdown: "# Body" })).resolves.toBe(8);
  });

  it("rejects malformed create IDs", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "8" }) });
    await expect(createBlog({ title: "Post", markdown: "# Body" })).rejects.toThrow(
      "Blog service returned an invalid post ID",
    );
  });

  it("sends authenticated update and delete requests", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await updateBlog(4, { title: "Updated", markdown: "# Updated" });
    await deleteBlog(4);

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "http://blog-service:8080/api/blogs/4",
      expect.objectContaining({ method: "PUT", headers: expect.any(Headers) }),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "http://blog-service:8080/api/blogs/4",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("rejects writes without a session token", async () => {
    mockCookies.mockResolvedValueOnce({ get: () => undefined });

    await expect(deleteBlog(4)).rejects.toMatchObject<Partial<BlogServiceError>>({
      status: 401,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    [401, "Your session has expired. Please sign in again."],
    [403, "You do not have permission to manage this blog."],
    [404, "This blog could not be found."],
    [500, "Backend failure"],
    [502, "Failed to update blog"],
  ])("maps write error status %i", async (status, message) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      text: async () => status === 502 ? "" : "Backend failure",
    });

    await expect(
      updateBlog(9, { title: "Post", markdown: "# Body" }),
    ).rejects.toMatchObject({ status, message });
  });

  it("uses the supplied backend host and port", async () => {
    process.env.BACKEND_SERVICE_HOST = "blog.internal";
    process.env.BACKEND_SERVICE_PORT = "9090";
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    await fetchBlogs();

    expect(mockFetch).toHaveBeenCalledWith("http://blog.internal:9090/api/blogs");
  });

  it("logs successful and failed HTTP responses and records their metrics", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    Reflect.set(process.env, "NODE_ENV", "development");
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => [] });

    try {
      await fetchBlogs();
      await expect(fetchBlogs()).rejects.toThrow("Failed to fetch blogs");
    } finally {
      Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
    }

    expect(serverLogger.debug).toHaveBeenCalledTimes(2);
    expect(serverLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ "http.response.status_code": 200 }),
      "http.response",
    );
    expect(serverLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ "http.response.status_code": 503 }),
      "http.response",
    );
    expect(mockRecordHttpClientMetrics).toHaveBeenCalledTimes(2);
  });

  it("records and logs network errors before rethrowing", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    Reflect.set(process.env, "NODE_ENV", "development");
    mockFetch.mockRejectedValueOnce(new Error("network down"));

    try {
      await expect(fetchBlogs()).rejects.toThrow("network down");
    } finally {
      Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
    }

    expect(serverLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: { name: "Error", message: "network down" },
      }),
      "http.error",
    );
    expect(mockRecordHttpClientMetrics).toHaveBeenCalledWith(
      "fetchBlogs",
      "GET",
      "error",
      expect.any(Number),
    );
  });
});
