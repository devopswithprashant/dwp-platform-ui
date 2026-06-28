/**
 * Markdown parsers typically collapse multiple blank lines into a single
 * paragraph break. Our backend stores raw markdown (including extra newlines),
 * so for UI parity we convert extra blank lines into a visible empty paragraph.
 *
 * Implementation detail: we insert a NBSP-only paragraph (U+00A0) for each
 * extra blank line beyond the first. This keeps rendering safe (no raw HTML).
 */
export function preserveExtraBlankLines(markdown: string): string {
  return markdown.replace(/\n{3,}/g, (match) => {
    const extraBlankLines = match.length - 2;
    return `\n\n${Array.from({ length: extraBlankLines }, () => "\u00A0\n\n").join("")}`;
  });
}

export function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/** Accept markdown from API payloads that may use different field names. */
export function resolveBlogContentText(
  data: string | { content?: unknown; markdown?: unknown; body?: unknown },
): string {
  if (typeof data === "string") {
    return data;
  }

  for (const value of [data.content, data.markdown, data.body]) {
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
}

/**
 * Convert plain markdown text to HTML for Tiptap to properly parse.
 * Handles:
 * - Newline-separated paragraphs: "line1\nline2" -> <p>line1</p><p>line2</p>
 * - Lists: "- item" -> <ul><li>item</li></ul>
 * - Emphasis: *text* -> <em>text</em>, **text** -> <strong>text</strong>
 */
export function markdownToTiptapHTML(markdown: string): string {
  if (!markdown.trim()) return "<p></p>";

  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Split by double newlines for paragraphs, single newlines for soft breaks
  const paragraphs = escaped.split(/\n\n+/).filter((p) => p.trim());

  const html = paragraphs
    .map((para) => {
      // Handle bullet lists: lines starting with "- "
      if (para.startsWith("- ")) {
        const items = para.split("\n").map((line) => {
          const text = line.replace(/^- /, "").trim();
          return `<li><p>${text}</p></li>`;
        });
        return `<ul>${items.join("")}</ul>`;
      }

      // Handle numbered lists: lines starting with "1. ", "2. ", etc
      if (/^\d+\. /.test(para)) {
        const items = para.split("\n").map((line) => {
          const text = line.replace(/^\d+\.\s*/, "").trim();
          return `<li><p>${text}</p></li>`;
        });
        return `<ol>${items.join("")}</ol>`;
      }

      // Regular paragraph - replace soft newlines with spaces
      const text = para.replace(/\n/g, " ");
      return `<p>${text}</p>`;
    })
    .join("");

  return html || "<p></p>";
}
