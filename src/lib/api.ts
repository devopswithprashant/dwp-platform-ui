import {
  BlogMetadata,
  BlogContent,
  CreateBlogRequest,
  UpdateBlogRequest,
} from "./types";

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
  const port = process.env.BACKEND_SERVICE_PORT || "9090";
  return `http://${host}:${port}/api`;
};


export async function fetchBlogs(): Promise<BlogMetadata[]> {
  console.log("Fetching blogs from:", `${getApiBaseUrl()}/blogs`);
  
  const res = await fetch(`${getApiBaseUrl()}/blogs`);

  if (!res.ok) {
    throw new Error("Failed to fetch blogs");
  }

  const data = await res.json();
  console.log("Raw API Response:", data);
  console.log("Response Type:", typeof data);
  console.log("Is Array?:", Array.isArray(data));
  
  const result = Array.isArray(data) ? data : data.content || [];
  console.log("Processed blogs:", result);
  console.log("Blogs count:", result.length);
  
  return result;
}

export async function fetchBlogContent(
  blogId: number
): Promise<BlogContent> {
  const res = await fetch(`${getApiBaseUrl()}/blogs/${blogId}/content`);

  if (!res.ok) {
    throw new Error("Blog not found");
  }

  return res.json();
}

export async function createBlog(
  payload: CreateBlogRequest
): Promise<BlogMetadata> {
  const res = await fetch(`${getApiBaseUrl()}/blogs`, {
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
  const res = await fetch(`${getApiBaseUrl()}/blogs/${blogId}`, {
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
  const res = await fetch(`${getApiBaseUrl()}/blogs/${blogId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to delete blog");
  }
}