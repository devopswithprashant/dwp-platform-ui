"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlogServiceError, deleteBlog } from "@/lib/api.client";

export default function DeleteBlogButton({
  blogId,
  blogSlug,
}: {
  blogId: number;
  blogSlug: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(true);

  function onDelete() {
    setError(null);
    const ok = window.confirm("Delete this blog? This cannot be undone.");
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteBlog(blogId);
        router.push("/blogs");
        router.refresh();
      } catch (err) {
        if (err instanceof BlogServiceError && err.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/blogs/${blogSlug}`)}`);
          return;
        }
        if (err instanceof BlogServiceError && err.status === 403) {
          setCanManage(false);
          setError("You no longer have permission to manage this blog.");
          return;
        }
        if (err instanceof BlogServiceError && err.status === 404) {
          router.push("/blogs");
          router.refresh();
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to delete blog";
        setError(message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {canManage ? (
        <div className="flex items-center gap-2">
          <Link
            href={`/blogs/${blogSlug}/edit`}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-900"
          >
            Update
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="max-w-[380px] rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
