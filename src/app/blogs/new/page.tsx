"use client";

import BlogEditor from "../_components/BlogEditor";

export default function NewBlogPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create a new blog</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Write in Markdown, preview instantly, then publish.
          </p>
        </div>
      </div>

      <BlogEditor mode="create" />
    </main>
  );
}

