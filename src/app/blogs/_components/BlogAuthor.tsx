import type { BlogAuthorProfile } from "@/lib/types";

function safeAvatarUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export default function BlogAuthor({
  profile,
  authorUuid,
}: {
  profile: BlogAuthorProfile | null;
  authorUuid: string | null;
}) {
  const verifiedProfile = profile?.userId === authorUuid ? profile : null;
  const name = verifiedProfile?.displayName?.trim() || "Author unavailable";
  const avatarUrl = safeAvatarUrl(verifiedProfile?.avatarUrl ?? null);

  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        // Profile-service avatar URLs are restricted to HTTPS before rendering.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200"
        >
          {name === "Author unavailable" ? "?" : name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {verifiedProfile?.bio ? (
          <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{verifiedProfile.bio}</p>
        ) : null}
      </div>
    </div>
  );
}
