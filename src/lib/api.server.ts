import "server-only";

import { cookies } from "next/headers";
import type {
  BlogContent,
  BlogMetadata,
  CreateBlogRequest,
  UpdateBlogRequest,
} from "./types";
import { ACCESS_TOKEN_COOKIE } from "./auth/token";
import { serverLogger as logger } from "./logging/server";
import { recordHttpClientMetrics } from "./metrics/httpClient";

// SSR (Node.js server): must use absolute URL, goes direct to backend
const getApiBaseUrl = () => {
  const host = process.env.BACKEND_SERVICE_HOST || "blog-service";
  const port = process.env.BACKEND_SERVICE_PORT || "8080";
  return `http://${host}:${port}/api`;
};

export class BlogServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BlogServiceError";
  }
}

type FetchMeta = {
  "event.action": string;
  "url.full": string;
  "http.request.method": string;
  "trace.id": string;
  "http.response.status_code"?: number;
  "event.duration"?: number;
};

async function loggedFetch(
  operation: string,
  input: string,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (method !== "GET" && method !== "HEAD") {
    const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) {
      throw new BlogServiceError("Your session has expired. Please sign in again.", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (process.env.NODE_ENV === "test") {
    if (!init) return fetch(input);
    return fetch(
      input,
      method !== "GET" && method !== "HEAD" ? { ...init, headers } : init,
    );
  }

  const url = input;
  const requestId =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const started = Date.now();

  headers.set("x-request-id", requestId);

  const meta: FetchMeta = {
    "event.action": operation,
    "url.full": url,
    "http.request.method": method,
    "trace.id": requestId,
  };

  logger.debug(meta, "http.request");
  try {
    const res = await fetch(input, { ...init, headers });
    const durationMs = Date.now() - started;
    const done: FetchMeta = {
      ...meta,
      "http.response.status_code": res.status,
      // ECS duration is in nanoseconds
      "event.duration": durationMs * 1_000_000,
    };

    if (res.ok) {
      logger.info(done, "http.response");
    } else {
      logger.warn(done, "http.response");
    }

    recordHttpClientMetrics(operation, method, res.status, durationMs / 1000);

    return res;
  } catch (err) {
    const durationMs = Date.now() - started;
    recordHttpClientMetrics(operation, method, "error", durationMs / 1000);
    logger.error(
      {
        ...meta,
        "event.duration": durationMs * 1_000_000,
        error: err instanceof Error ? { name: err.name, message: err.message } : err,
      },
      "http.error"
    );
    throw err;
  }
}

export async function fetchBlogs(): Promise<BlogMetadata[]> {
  const url = `${getApiBaseUrl()}/blogs`;
  const res = await loggedFetch("fetchBlogs", url);

  if (!res.ok) {
    throw new Error("Failed to fetch blogs");
  }

  const data = await res.json();
  const result = Array.isArray(data) ? data : data.content || [];
  return result;
}

export async function fetchBlogContent(blogId: number): Promise<BlogContent> {
  const url = `${getApiBaseUrl()}/blogs/${blogId}/content`;
  const res = await loggedFetch("fetchBlogContent", url);

  if (!res.ok) {
    throw new Error("Blog not found");
  }

  return res.json();
}

export async function createBlog(
  payload: CreateBlogRequest
): Promise<number> {
  const url = `${getApiBaseUrl()}/blogs`;
  const res = await loggedFetch("createBlog", url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await readBlogServiceError(res, "Failed to create blog");
  }

  const data: unknown = await res.json();
  const id = typeof data === "number"
    ? data
    : data !== null && typeof data === "object" && "id" in data && typeof data.id === "number"
      ? data.id
      : null;
  if (id === null || !Number.isFinite(id)) {
    throw new Error("Blog service returned an invalid post ID");
  }
  return id;
}

export async function updateBlog(
  blogId: number,
  payload: UpdateBlogRequest
): Promise<void> {
  const url = `${getApiBaseUrl()}/blogs/${blogId}`;
  const res = await loggedFetch("updateBlog", url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await readBlogServiceError(res, "Failed to update blog");
  }
}

export async function deleteBlog(blogId: number): Promise<void> {
  const url = `${getApiBaseUrl()}/blogs/${blogId}`;
  const res = await loggedFetch("deleteBlog", url, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw await readBlogServiceError(res, "Failed to delete blog");
  }
}

async function readBlogServiceError(
  res: Response,
  fallback: string,
): Promise<BlogServiceError> {
  const text = await res.text().catch(() => "");
  const message =
    res.status === 401
      ? "Your session has expired. Please sign in again."
      : res.status === 403
        ? "You do not have permission to manage this blog."
        : res.status === 404
          ? "This blog could not be found."
          : text || fallback;
  return new BlogServiceError(message, res.status);
}
