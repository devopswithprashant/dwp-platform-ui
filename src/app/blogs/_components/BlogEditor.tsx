"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CreateBlogRequest, UpdateBlogRequest } from "@/lib/types";
import {
  BlogServiceError,
  createBlog,
  publishBlog,
  updateBlog,
} from "@/lib/api.client";
import RichTextEditor, { type RichTextEditorHandle } from "./RichTextEditor";

type Mode = "create" | "edit";
type SaveAction = "draft" | "publish" | "live";

export default function BlogEditor(props: {
  mode: Mode;
  blogId?: number;
  status?: string;
  initialTitle?: string;
  initialMarkdown?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const createdDraftId = useRef<number | null>(null);

  const [title, setTitle] = useState(props.initialTitle ?? "");
  const [hasContent, setHasContent] = useState(() =>
    Boolean(props.initialMarkdown?.trim()),
  );
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<SaveAction | null>(null);
  const isPublishedEdit =
    props.mode === "edit" && props.status?.toUpperCase() === "PUBLISHED";

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

  function save(action: SaveAction) {
    if (isPending || !canSubmit) return;
    setError(null);

    const markdown = editorRef.current?.getMarkdown() ?? "";

    setActiveAction(action);
    startTransition(async () => {
      try {
        if (props.mode === "create") {
          const payload: CreateBlogRequest = {
            title: title.trim(),
            markdown,
          };
          if (createdDraftId.current === null) {
            createdDraftId.current = await createBlog(payload);
          } else {
            await updateBlog(createdDraftId.current, payload);
          }
          if (action === "publish") {
            await publishBlog(createdDraftId.current);
          }
        } else {
          const payload: UpdateBlogRequest = {
            title: title.trim(),
            markdown,
          };
          await updateBlog(props.blogId!, payload);
          if (action === "publish") {
            await publishBlog(props.blogId!);
          }
        }

        router.push(action === "draft" ? "/profile" : "/blogs");
        router.refresh();
      } catch (err) {
        if (err instanceof BlogServiceError && err.status === 401) {
          const callbackUrl = props.mode === "create"
            ? "/blogs/new"
            : `/blogs/${props.blogId}/edit`;
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }
        if (err instanceof BlogServiceError && err.status === 404) {
          router.push("/blogs");
          router.refresh();
          return;
        }
        const message = err instanceof Error ? err.message : "Request failed";
        setError(
          props.mode === "create" &&
            action === "publish" &&
            createdDraftId.current !== null
            ? `The draft was saved, but publishing failed: ${message}`
            : message,
        );
      } finally {
        setActiveAction(null);
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(isPublishedEdit ? "live" : "draft");
      }}
      className="space-y-6"
    >
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
          <div className="flex flex-wrap gap-2">
            {isPublishedEdit ? (
              <button
                type="submit"
                disabled={!canSubmit || isPending}
                className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save published changes"}
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={!canSubmit || isPending}
                  className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-900"
                >
                  {isPending && activeAction === "draft" ? "Saving..." : "Save as draft"}
                </button>
                <button
                  type="button"
                  onClick={() => save("publish")}
                  disabled={!canSubmit || isPending}
                  className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending && activeAction === "publish" ? "Publishing..." : "Publish"}
                </button>
              </>
            )}
          </div>
        }
      />

      {isPublishedEdit ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Saving these changes updates the published version immediately. Saving
          published edits as a separate draft requires backend API support.
        </p>
      ) : null}

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
          Saving a draft returns you to your profile; publishing returns you to the blog list.
        </p>
      </div>
    </form>
  );
}
