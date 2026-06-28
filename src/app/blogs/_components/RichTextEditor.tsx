"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "@tiptap/markdown";
import { createLowlight, common } from "lowlight";
import { normalizeMarkdown } from "@/lib/markdown";

const editorClassName =
  "blog-editor min-h-[420px] w-full rounded-xl border border-gray-200 bg-transparent p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800";

const toolbarButtonClass =
  "rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900";

const lowlight = createLowlight(common);

const extensions = [
  StarterKit.configure({
    codeBlock: false,
    link: false,
  }),
  Link.configure({ openOnClick: false }),
  Placeholder.configure({ placeholder: "Write your blog in rich text…" }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Typography,
  CodeBlockLowlight.configure({ lowlight }),
  Markdown,
];

const editorProps = {
  attributes: {
    class: editorClassName,
  },
};

export type RichTextEditorHandle = {
  getMarkdown: () => string;
};

type RichTextEditorProps = {
  initialMarkdown?: string;
  onContentChange?: (isEmpty: boolean) => void;
  toolbarEnd?: React.ReactNode;
};

function preventToolbarFocusLoss(event: React.MouseEvent) {
  event.preventDefault();
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ initialMarkdown = "", onContentChange, toolbarEnd }, ref) {
    const latestMarkdown = useRef(normalizeMarkdown(initialMarkdown));

    const handleUpdate = useCallback(
      ({ editor }: { editor: Editor }) => {
        latestMarkdown.current = normalizeMarkdown(editor.getMarkdown());
        onContentChange?.(editor.isEmpty);
      },
      [onContentChange],
    );

    const editor = useEditor(
      {
        extensions,
        editorProps,
        content: initialMarkdown,
        contentType: "markdown",
        immediatelyRender: false,
        onUpdate: handleUpdate,
      },
      [],
    );

    useImperativeHandle(
      ref,
      () => ({
        getMarkdown: () => {
          if (editor && !editor.isDestroyed) {
            return normalizeMarkdown(editor.getMarkdown());
          }
          return latestMarkdown.current;
        },
      }),
      [editor],
    );

    function insertLink() {
      const url = window.prompt("Paste URL");
      if (!url || !editor) return;
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 p-2 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={toolbarButtonClass}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`${toolbarButtonClass} italic`}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`${toolbarButtonClass} underline`}
            title="Underline"
          >
            U
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={toolbarButtonClass}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={toolbarButtonClass}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={toolbarButtonClass}
            title="Bullet list"
          >
            • List
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClass}
            title="Numbered list"
          >
            1. List
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={toolbarButtonClass}
            title="Quote"
          >
            “ ”
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            className={toolbarButtonClass}
            title="Code block"
          >
            {"```"}
          </button>
          <button
            type="button"
            onMouseDown={preventToolbarFocusLoss}
            onClick={insertLink}
            className={toolbarButtonClass}
            title="Link"
          >
            Link
          </button>
          </div>
          {toolbarEnd}
        </div>

        <div className="p-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);

export default RichTextEditor;
