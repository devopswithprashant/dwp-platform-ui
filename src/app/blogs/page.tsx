import { fetchBlogs } from "@/lib/api";
import Link from "next/link";

export default async function BlogsPage() {
  const blogs = await fetchBlogs();

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