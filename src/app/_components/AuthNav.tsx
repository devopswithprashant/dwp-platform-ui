"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth/types";
import { fetchCurrentUser, logoutUser } from "@/lib/auth/auth.client";

export default function AuthNav({ initialUser }: { initialUser: AuthUser | null }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  useEffect(() => {
    if (initialUser) return;

    let active = true;
    async function loadUser() {
      try {
        const current = await fetchCurrentUser();
        if (active) setUser(current);
      } catch {
        if (active) setUser(null);
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [initialUser]);

  function onLogout() {
    logoutUser();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-gray-600 sm:inline dark:text-gray-300">
          {user.username}
        </span>
        <Link
          href="/profile"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          Profile
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-900"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Sign up
      </Link>
    </div>
  );
}
