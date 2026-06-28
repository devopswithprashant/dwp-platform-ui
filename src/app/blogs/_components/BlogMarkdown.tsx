import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import { preserveExtraBlankLines, resolveBlogContentText } from "@/lib/markdown";

const remarkPlugins: PluggableList = [remarkBreaks as never, remarkGfm as never];

type BlogMarkdownProps = {
  content: string;
};

export default function BlogMarkdown({ content }: BlogMarkdownProps) {
  const markdown = preserveExtraBlankLines(resolveBlogContentText(content));

  return (
    <article className="blog-content prose prose-zinc max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={remarkPlugins}>{markdown}</ReactMarkdown>
    </article>
  );
}
