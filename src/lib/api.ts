import {
  BlogMetadata,
  BlogContent,
  CreateBlogRequest,
  UpdateBlogRequest,
} from "./types";
import { getLogger } from "./logging/getLogger";

// Use local /api endpoint which Nginx proxies to backend
// Can be overridden with NEXT_PUBLIC_BLOG_API_URL for external backends
//const getApiBaseUrl() = process.env.NEXT_PUBLIC_BLOG_API_URL || "/api";

// After — absolute URL for SSR, relative for browser
const getApiBaseUrl = () => {
  // Browser: relative URL, nginx proxies /api/* → backend
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_BLOG_API_URL || "/api";
  }
  // SSR (Node.js server): must use absolute URL, goes direct to backend
  const host = process.env.BACKEND_SERVICE_HOST || "blog-service";
  const port = process.env.BACKEND_SERVICE_PORT || "8080";
  return `http://${host}:${port}/api`;
};

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
  const logger = await getLogger();
  if (process.env.NODE_ENV === "test") {
    // Keep calls stable for unit tests (no header mutation / wrapping).
    return init ? fetch(input, init) : fetch(input);
  }

  const method = (init?.method || "GET").toUpperCase();
  const url = input;
  const requestId =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const started = Date.now();

  const headers = new Headers(init?.headers);
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

    return res;
  } catch (err) {
    const durationMs = Date.now() - started;
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

export async function fetchBlogContent(
  blogId: number
): Promise<BlogContent> {
  const url = `${getApiBaseUrl()}/blogs/${blogId}/content`;
  const res = await loggedFetch("fetchBlogContent", url);

  if (!res.ok) {
    throw new Error("Blog not found");
  }

  return res.json();
}

export async function createBlog(
  payload: CreateBlogRequest
): Promise<BlogMetadata> {
  const url = `${getApiBaseUrl()}/blogs`;
  const res = await loggedFetch("createBlog", url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to create blog");
  }

  return res.json();
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
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to update blog");
  }
}

export async function deleteBlog(blogId: number): Promise<void> {
  const url = `${getApiBaseUrl()}/blogs/${blogId}`;
  const res = await loggedFetch("deleteBlog", url, {
    method: "DELETE",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to delete blog");
  }
}