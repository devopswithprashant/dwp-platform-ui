"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBlog } from "@/lib/api";

export default function DeleteBlogButton({ blogId }: { blogId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    setError(null);
    const ok = window.confirm("Delete this blog? This cannot be undone.");
    if (!ok) return;

    startTransition(async () => {
      try {
        await deleteBlog(blogId);
        router.push("/");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete blog";
        setError(message);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {error ? (
        <div className="max-w-[380px] rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

