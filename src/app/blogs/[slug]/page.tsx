import { notFound } from "next/navigation";
import { fetchBlogContent, fetchBlogs } from "@/lib/api.server";
import { getAuthUser } from "@/lib/auth/auth.server";
import DeleteBlogButton from "@/app/blogs/_components/DeleteBlogButton";
import BlogMarkdown from "@/app/blogs/_components/BlogMarkdown";
import BlogAuthor from "@/app/blogs/_components/BlogAuthor";
import { getCurrentProfileUserId } from "@/lib/profiles.server";

export default async function BlogPage({
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
  const meta = blogs.find((b) => b.slug === slug);
  if (!meta) notFound();

  const blog = await fetchBlogContent(meta.id);
  const isOwner =
    Boolean(user) &&
    Boolean(meta.authorUuid) &&
    currentProfileUserId !== null &&
    meta.authorUuid === currentProfileUserId;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
        {isOwner ? <DeleteBlogButton blogId={meta.id} blogSlug={meta.slug} /> : null}
      </div>
      <div className="mb-8">
        <BlogAuthor
          profile={meta.authorProfile ?? null}
          authorUuid={meta.authorUuid ?? null}
        />
      </div>
      <BlogMarkdown content={blog.content} />
    </main>
  );
}
