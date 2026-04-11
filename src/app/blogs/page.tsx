import { fetchBlogs } from "@/lib/api";
import Link from "next/link";
import type { BlogMetadata } from "@/lib/types";

// Disable static generation for this page - fetch data at request time instead
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function BlogsPage() {
  let blogs: BlogMetadata[] = [];
  let error: string | null = null;

  try {
    blogs = await fetchBlogs();
  } catch (err) {
    console.error("Failed to fetch blogs:", err);
    error = err instanceof Error ? err.message : "Failed to load blogs";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All blogs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Long-form notes and stories on DevOps, infra and systems.
          </p>
        </div>
        <Link
          href="/blogs/new"
          className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        >
          Create Blog
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-semibold">Error loading blogs</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <ul className="space-y-4">
        {blogs && blogs.length > 0 ? (
          blogs.map((blog) => (
            <li
              key={blog.id}
              className="group rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70 dark:hover:border-blue-500/40"
            >
              <Link
                href={`/blogs/${blog.slug}`}
                className="text-lg font-semibold text-gray-900 transition group-hover:text-blue-600 dark:text-gray-50"
              >
                {blog.title}
              </Link>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {blog.status === "PUBLISHED" ? "Published" : "Draft"}
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No blogs yet. Be the first to{" "}
            <Link href="/blogs/new" className="underline">
              write one
            </Link>
            .
          </p>
        )}
      </ul>
    </main>
  );
}