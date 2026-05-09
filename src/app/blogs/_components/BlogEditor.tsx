"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import type { CreateBlogRequest, UpdateBlogRequest } from "@/lib/types";
import { createBlog, updateBlog } from "@/lib/api.client";
import { preserveExtraBlankLines } from "@/lib/markdown";

type Mode = "create" | "edit";
type Tab = "write" | "preview";

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
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(props.initialTitle ?? "");
  const [authorId, setAuthorId] = useState<number>(props.initialAuthorId ?? 1);
  const [markdown, setMarkdown] = useState(props.initialMarkdown ?? "");
  const [tab, setTab] = useState<Tab>("write");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const common = title.trim().length > 0 && markdown.trim().length > 0;
    if (props.mode === "create") return common && Number.isFinite(authorId);
    return common && Number.isFinite(props.blogId);
  }, [title, markdown, authorId, props.mode, props.blogId]);

  function applyWrap(before: string, after: string, placeholder: string) {
    const el = editorRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;
    const selected = value.slice(start, end);
    const inner = selected.length > 0 ? selected : placeholder;

    const nextValue =
      value.slice(0, start) + before + inner + after + value.slice(end);
    setMarkdown(nextValue);

    requestAnimationFrame(() => {
      el.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + inner.length;
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function applyLinePrefix(prefix: string) {
    const el = editorRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;

    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIdx = value.indexOf("\n", end);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    const line = value.slice(lineStart, lineEnd);

    const nextLine = line.startsWith(prefix) ? line.slice(prefix.length) : prefix + line;
    const nextValue = value.slice(0, lineStart) + nextLine + value.slice(lineEnd);
    setMarkdown(nextValue);

    requestAnimationFrame(() => {
      el.focus();
      const delta = nextLine.length - line.length;
      el.setSelectionRange(start + delta, end + delta);
    });
  }

  function insertLink() {
    const url = window.prompt("Paste URL");
    if (!url) return;
    applyWrap("[", `](${url})`, "link text");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (props.mode === "create") {
          const payload: CreateBlogRequest = {
            title: title.trim(),
            authorId,
            markdown,
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

  const submitText =
    props.submitLabel ?? (props.mode === "create" ? "Create" : "Update");

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

        {props.mode === "create" ? (
          <label>
            <span className="mb-2 block text-sm font-medium">Author ID</span>
            <input
              value={authorId}
              onChange={(e) => setAuthorId(Number(e.target.value))}
              inputMode="numeric"
              className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800"
            />
          </label>
        ) : (
          <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Editing
            </div>
            <div className="mt-1">Blog ID: {props.blogId}</div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 p-2 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("write")}
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                tab === "write"
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900",
              ].join(" ")}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                tab === "preview"
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-900",
              ].join(" ")}
            >
              Preview
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? `${submitText}...` : submitText}
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === "write" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyWrap("**", "**", "bold")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => applyWrap("_", "_", "italic")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold italic text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("# ")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Heading"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("## ")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Subheading"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => applyWrap("`", "`", "code")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Inline code"
                >
                  {"</>"}
                </button>
                <button
                  type="button"
                  onClick={() => applyWrap("\n``` \n", "\n```\n", "code block")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Code block"
                >
                  {"```"}
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("> ")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Quote"
                >
                  {"“”"}
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("- ")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Bullet list"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => applyLinePrefix("1. ")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Numbered list"
                >
                  1. List
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                  title="Link"
                >
                  Link
                </button>
                <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  Tip: select text, then click a tool.
                </div>
              </div>

              <textarea
                ref={editorRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your blog in Markdown…"
                className="min-h-[420px] w-full resize-y rounded-xl border border-gray-200 bg-transparent p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800"
              />
            </div>
          ) : (
            <div className="prose max-w-none dark:prose-invert">
              <ReactMarkdown>{preserveExtraBlankLines(markdown)}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

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

