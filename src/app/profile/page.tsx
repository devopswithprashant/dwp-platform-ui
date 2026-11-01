"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/profile.types";
import type { BlogMetadata } from "@/lib/types";
import { fetchBlogs } from "@/lib/api.client";
import {
  fetchProfile,
  updateProfile,
  ProfileApiError,
  type ProfileUpdate,
} from "@/lib/profile.client";

type ProfileForm = {
  displayName: string;
  bio: string;
  avatarUrl: string;
  preferences: string;
  socialLinks: string;
};

type FormErrors = Partial<Record<keyof ProfileForm, string>>;
const profileFields: (keyof ProfileForm)[] = [
  "displayName",
  "bio",
  "avatarUrl",
  "preferences",
  "socialLinks",
];

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toForm(profile: Profile): ProfileForm {
  return {
    displayName: profile.displayName ?? "",
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    preferences: JSON.stringify(profile.preferences, null, 2),
    socialLinks: JSON.stringify(profile.socialLinks, null, 2),
  };
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function parseObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }

  if (!isObjectRecord(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed;
}

function validateForm(form: ProfileForm): {
  update?: ProfileUpdate;
  errors: FormErrors;
  error?: string;
} {
  const errors: FormErrors = {};
  const displayName = form.displayName.trim();
  const bio = form.bio.trim();
  const avatarUrl = form.avatarUrl.trim();

  if (codePointLength(displayName) > 100) {
    errors.displayName = "Must be at most 100 characters.";
  }
  if (codePointLength(bio) > 500) {
    errors.bio = "Must be at most 500 characters.";
  }
  if (codePointLength(avatarUrl) > 2048) {
    errors.avatarUrl = "Must be at most 2048 characters.";
  } else if (avatarUrl) {
    try {
      const parsed = new URL(avatarUrl);
      if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
        errors.avatarUrl = "Enter an absolute HTTPS URL without user information.";
      }
    } catch {
      errors.avatarUrl = "Enter a valid absolute HTTPS URL.";
    }
  }

  let preferences: Record<string, unknown> | undefined;
  let socialLinks: Record<string, unknown> | undefined;
  try {
    preferences = parseObject(form.preferences, "Preferences");
  } catch (err) {
    errors.preferences = err instanceof Error ? err.message : "Preferences must be a JSON object.";
  }
  try {
    socialLinks = parseObject(form.socialLinks, "Social links");
  } catch (err) {
    errors.socialLinks = err instanceof Error ? err.message : "Social links must be a JSON object.";
  }

  if (Object.keys(errors).length || !preferences || !socialLinks) {
    return { errors };
  }

  return {
    errors,
    update: {
      displayName: displayName || null,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
      preferences,
      socialLinks,
    },
  };
}

function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [blogs, setBlogs] = useState<BlogMetadata[]>([]);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchProfileData = useCallback(
    () => Promise.allSettled([fetchProfile(), fetchBlogs()]),
    [],
  );

  const applyProfileData = useCallback(
    ([profileResult, blogsResult]: Awaited<ReturnType<typeof fetchProfileData>>) => {
      setError(null);
      setBlogsError(null);
      setNotFound(false);
      if (blogsResult.status === "fulfilled") {
        setBlogs(blogsResult.value);
      } else {
        setBlogs([]);
        setBlogsError(
          blogsResult.reason instanceof Error
            ? blogsResult.reason.message
            : "Unable to load your blogs.",
        );
      }
      if (profileResult.status === "rejected") throw profileResult.reason;

      const result = profileResult.value;
      setProfile(result);
      setForm(toForm(result));
    },
    [],
  );

  const handleProfileLoadError = useCallback(
    (err: unknown) => {
      if (err instanceof ProfileApiError && err.status === 401) {
        router.replace("/login?callbackUrl=%2Fprofile");
        return;
      }
      if (err instanceof ProfileApiError && err.status === 404) {
        setNotFound(true);
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load your profile.");
    },
    [router],
  );

  const ownBlogs = profile
    ? blogs.filter((blog) => blog.authorUuid === profile.userId)
    : [];
  const draftBlogs = ownBlogs.filter(
    (blog) => blog.status?.toUpperCase() === "DRAFT",
  );
  const publishedBlogs = ownBlogs.filter(
    (blog) => blog.status?.toUpperCase() === "PUBLISHED",
  );

  useEffect(() => {
    let active = true;
    fetchProfileData()
      .then((result) => {
        if (active) applyProfileData(result);
      })
      .catch((err: unknown) => {
        if (active) handleProfileLoadError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyProfileData, fetchProfileData, handleProfileLoadError]);

  function cancelEditing() {
    if (profile) setForm(toForm(profile));
    setErrors({});
    setError(null);
    setEditing(false);
  }

  function retryLoadProfile() {
    setLoading(true);
    setError(null);
    setBlogsError(null);
    setNotFound(false);
    fetchProfileData()
      .then(applyProfileData)
      .catch(handleProfileLoadError)
      .finally(() => setLoading(false));
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    setErrors({});
    setError(null);
    const validation = validateForm(form);
    const update = validation.update;
    if (!update) {
      setErrors(validation.errors);
      return;
    }

    startTransition(async () => {
      try {
        const updated = await updateProfile(update);
        setProfile(updated);
        setForm(toForm(updated));
        setEditing(false);
      } catch (err) {
        if (err instanceof ProfileApiError && err.status === 401) {
          router.replace("/login?callbackUrl=%2Fprofile");
          return;
        }
        if (err instanceof ProfileApiError && err.status === 400) {
          const fieldErrors: FormErrors = {};
          for (const detail of err.details) {
            const field = profileFields.find((candidate) => candidate === detail.field);
            if (field) fieldErrors[field] = detail.message;
          }
          setErrors(fieldErrors);
          setError(
            Object.keys(fieldErrors).length
              ? null
              : "The profile could not be saved. Review your entries and try again.",
          );
          return;
        }
        if (err instanceof ProfileApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to save your profile.");
      }
    });
  }

  const controlClass =
    "w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800";
  const mutedClass = "text-sm text-gray-600 dark:text-gray-300";

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Account</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Your profile</h1>
          <p className={`mt-2 ${mutedClass}`}>View and manage your profile information.</p>
        </div>
        {profile && !editing ? (
          <button
            type="button"
            onClick={() => {
              setForm(toForm(profile));
              setEditing(true);
              setError(null);
            }}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Edit profile
          </button>
        ) : null}
      </div>

      {loading ? <p role="status" className={mutedClass}>Loading your profile…</p> : null}

      {notFound ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <h2 className="font-semibold">Profile not available</h2>
          <p className="mt-2 text-sm">
            Your profile may still be provisioning. Sign out and back in later, or contact support if it remains unavailable.
          </p>
          <button
            type="button"
            onClick={retryLoadProfile}
            className="mt-4 text-sm font-semibold underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
          {!editing ? (
            <button type="button" onClick={retryLoadProfile} className="ml-2 font-semibold underline">
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {profile && form && !editing && !loading && !notFound ? (
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
          <div>
            <h2 className="text-xl font-semibold">{profile.displayName || "Add a display name"}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileValue label="Bio" value={profile.bio || "Not provided"} />
            <ProfileValue label="Avatar URL" value={profile.avatarUrl} />
            <ProfileValue label="Created" value={new Date(profile.createdAt).toLocaleString()} />
            <ProfileValue label="Last updated" value={new Date(profile.updatedAt).toLocaleString()} />
          </div>
          <ProfileObject label="Preferences" values={profile.preferences} />
          <ProfileObject label="Social links" values={profile.socialLinks} />
        </div>
      ) : null}

      {profile && form && editing && !loading && !notFound ? (
        <form onSubmit={saveProfile} className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
          <ProfileInput
            label="Display name"
            value={form.displayName}
            onChange={(value) => setForm({ ...form, displayName: value })}
            error={errors.displayName}
            className={controlClass}
          />
          <ProfileInput
            label="Bio"
            value={form.bio}
            onChange={(value) => setForm({ ...form, bio: value })}
            error={errors.bio}
            className={controlClass}
            multiline
          />
          <ProfileInput
            label="Avatar URL"
            value={form.avatarUrl}
            onChange={(value) => setForm({ ...form, avatarUrl: value })}
            error={errors.avatarUrl}
            className={controlClass}
            type="url"
          />
          <ProfileInput
            label="Preferences (JSON object)"
            value={form.preferences}
            onChange={(value) => setForm({ ...form, preferences: value })}
            error={errors.preferences}
            className={`${controlClass} min-h-32 font-mono`}
            multiline
          />
          <ProfileInput
            label="Social links (JSON object)"
            value={form.socialLinks}
            onChange={(value) => setForm({ ...form, socialLinks: value })}
            error={errors.socialLinks}
            className={`${controlClass} min-h-32 font-mono`}
            multiline
          />
          {error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isPending}
              className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : null}

      {profile && !loading && !notFound ? (
        <section className="mt-10 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Your blogs</h2>
            <p className={`mt-1 ${mutedClass}`}>
              Drafts are visible only in your profile; published posts are public.
            </p>
          </div>

          {blogsError ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              Unable to load your blogs: {blogsError}
            </p>
          ) : (
            <>
              <section aria-labelledby="draft-blogs-heading">
                <h3 id="draft-blogs-heading" className="text-lg font-semibold">
                  Drafts
                </h3>
                {draftBlogs.length ? (
                  <BlogList blogs={draftBlogs} isDraft />
                ) : (
                  <p className={`mt-2 ${mutedClass}`}>You have no drafts.</p>
                )}
              </section>

              <section aria-labelledby="published-blogs-heading">
                <h3 id="published-blogs-heading" className="text-lg font-semibold">
                  Published posts
                </h3>
                {publishedBlogs.length ? (
                  <BlogList blogs={publishedBlogs} />
                ) : (
                  <p className={`mt-2 ${mutedClass}`}>You have no published posts.</p>
                )}
              </section>
            </>
          )}
        </section>
      ) : null}

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="font-medium hover:underline">Back to home</Link>
      </p>
    </section>
  );
}

function BlogList({ blogs, isDraft = false }: { blogs: BlogMetadata[]; isDraft?: boolean }) {
  return (
    <ul className="mt-3 space-y-3">
      {blogs.map((blog) => (
        <li
          key={blog.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-gray-800 dark:bg-gray-900/70"
        >
          <div>
            <Link
              href={`/blogs/${blog.slug}`}
              className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
            >
              {blog.title}
            </Link>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isDraft ? "Draft" : "Published"}
            </p>
          </div>
          {isDraft ? (
            <Link
              href={`/blogs/${blog.slug}/edit`}
              className="text-sm font-semibold text-gray-700 hover:underline dark:text-gray-200"
            >
              Edit draft
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ProfileValue({ label, value }: { label: string; value: string | null }) {
  const safeUrl = value ? safeHttpsUrl(value) : null;
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
      {safeUrl ? (
        <a href={safeUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-blue-700 underline dark:text-blue-300">
          {value}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm">{value || "Not provided"}</p>
      )}
    </div>
  );
}

function ProfileObject({ label, values }: { label: string; values: Record<string, unknown> }) {
  const entries = Object.entries(values);
  return (
    <section>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h3>
      {entries.length ? (
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          {entries.map(([key, value]) => {
            const text = displayValue(value);
            const safeUrl = safeHttpsUrl(value);
            return (
              <div key={key} className="min-w-0 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{key}</dt>
                <dd className="mt-1 break-words text-sm">
                  {safeUrl ? (
                    <a href={safeUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline dark:text-blue-300">
                      {text}
                    </a>
                  ) : text || "—"}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">None set</p>
      )}
    </section>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  error,
  className,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className: string;
  multiline?: boolean;
  type?: string;
}) {
  const id = `profile-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const errorId = `${id}-error`;
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={className}
          rows={label.includes("JSON") ? 5 : 4}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={className}
        />
      )}
      {error ? <p id={errorId} className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
