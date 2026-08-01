"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CreateBlogRequest, UpdateBlogRequest } from "@/lib/types";
import { createBlog, updateBlog } from "@/lib/api.client";
import { fetchCurrentUser } from "@/lib/auth/auth.client";
import RichTextEditor, { type RichTextEditorHandle } from "./RichTextEditor";

type Mode = "create" | "edit";

export default function BlogEditor(props: {
  mode: Mode;
  blogId?: number;
  initialTitle?: string;
  initialAuthorId?: number;
  initialMarkdown?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [title, setTitle] = useState(props.initialTitle ?? "");
  const [authorIdentity, setAuthorIdentity] = useState<string | null>(
    props.initialAuthorId !== undefined ? String(props.initialAuthorId) : null,
  );
  const [hasContent, setHasContent] = useState(() =>
    Boolean(props.initialMarkdown?.trim()),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (props.mode !== "create" || authorIdentity !== null) return;

    void fetchCurrentUser().then((user) => {
      if (user) {
        const resolvedAuthorIdentity = typeof user.id === "number"
          ? String(user.id)
          : typeof user.id === "string"
            ? user.id
            : null;

        if (resolvedAuthorIdentity) {
          setAuthorIdentity(resolvedAuthorIdentity);
        }
      } else {
        router.push("/login?callbackUrl=/blogs/new");
      }
    });
  }, [props.mode, authorIdentity, router]);

  const handleContentChange = useCallback((isEmpty: boolean) => {
    setHasContent((current) => {
      const next = !isEmpty;
      return current === next ? current : next;
    });
  }, []);

  const canSubmit = useMemo(() => {
    const commonValid = title.trim().length > 0 && hasContent;
    if (props.mode === "create") return commonValid;
    return commonValid && Number.isFinite(props.blogId);
  }, [title, hasContent, props.mode, props.blogId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const markdown = editorRef.current?.getMarkdown() ?? "";

    startTransition(async () => {
      try {
        if (props.mode === "create") {
          const payload: CreateBlogRequest = {
            title: title.trim(),
            markdown,
            ...(authorIdentity ? { authorIdentity } : {}),
          };
          await createBlog(payload);
        } else {
          const payload: UpdateBlogRequest = {
            title: title.trim(),
            markdown,
          };
          await updateBlog(props.blogId!, payload);
        }

        router.push("/");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        setError(message);
      }
    });
  }

  const submitText = props.submitLabel ?? (props.mode === "create" ? "Create" : "Update");

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kubernetes: Production tips"
            className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800"
          />
        </label>

        {props.mode === "edit" ? (
          <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            <div className="font-medium text-gray-900 dark:text-gray-100">Editing</div>
            <div className="mt-1">Blog ID: {props.blogId}</div>
          </div>
        ) : null}
      </div>

      <RichTextEditor
        ref={editorRef}
        initialMarkdown={props.initialMarkdown}
        onContentChange={handleContentChange}
        toolbarEnd={
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? `${submitText}...` : submitText}
          </button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-gray-700 hover:underline dark:text-gray-300"
        >
          Cancel
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          After {props.mode === "create" ? "creation" : "update"} you’ll be redirected to Home.
        </p>
      </div>
    </form>
  );
}
