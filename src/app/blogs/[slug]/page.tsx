import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchBlogContent, fetchBlogs } from "@/lib/api";
import DeleteBlogButton from "@/app/blogs/_components/DeleteBlogButton";
import { preserveExtraBlankLines } from "@/lib/markdown";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Resolve slug -> blog id, then fetch content by id
  const blogs = await fetchBlogs();
  const meta = blogs.find((b) => b.slug === slug);
  if (!meta) notFound();

  const blog = await fetchBlogContent(meta.id);

  return (
    <main className="prose mx-auto max-w-4xl px-4 py-10 dark:prose-invert">
      <div className="not-prose mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/blogs/${meta.slug}/edit`}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-800 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-900"
          >
            Update
          </Link>
          <DeleteBlogButton blogId={meta.id} />
        </div>
      </div>
      <ReactMarkdown>{preserveExtraBlankLines(blog.content)}</ReactMarkdown>
    </main>
  );
}