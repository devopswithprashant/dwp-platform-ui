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

