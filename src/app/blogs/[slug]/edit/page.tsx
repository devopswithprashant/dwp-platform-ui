import { notFound, redirect } from "next/navigation";
import BlogEditor from "@/app/blogs/_components/BlogEditor";
import { fetchBlogContent, fetchBlogs } from "@/lib/api.server";
import { getAuthUser } from "@/lib/auth/auth.server";
import { getCurrentProfileUserId } from "@/lib/profiles.server";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [blogs, user, currentProfileUserId] = await Promise.all([
    fetchBlogs(),
    getAuthUser(),
    getCurrentProfileUserId(),
  ]);
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(`/blogs/${slug}/edit`)}`);
  const meta = blogs.find((b) => b.slug === slug);
  if (!meta) notFound();
  if (!meta.authorUuid || meta.authorUuid !== currentProfileUserId) {
    redirect(`/blogs/${meta.slug}`);
  }

  const content = await fetchBlogContent(meta.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Update blog</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Edit content, then save as a draft or publish your changes.
          </p>
        </div>
      </div>

      <BlogEditor
        mode="edit"
        blogId={meta.id}
        status={meta.status}
        initialTitle={meta.title}
        initialMarkdown={content.content}
      />
    </main>
  );
}
