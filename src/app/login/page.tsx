"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { loginUser } from "@/lib/auth/auth.client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await loginUser({ identifier: identifier.trim(), password });
        router.push(callbackUrl);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Username or email</span>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
          className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800"
        />
      </label>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        No account?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in to create, edit, or delete blog posts.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
        <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
