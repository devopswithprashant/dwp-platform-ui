"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("theme", next);
        document.documentElement.dataset.theme = next;
      }
      return next;
    });
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
    >
      {isDark ? (
        // Sun icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M12 4.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-1.5Zm0 13a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-1.5Zm6.5-5.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Zm-17 0A.75.75 0 0 1 2.25 11h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 1.5 12Zm2.72-6.53a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06L4.28 6.53a.75.75 0 0 1 0-1.06Zm11.38 11.38a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Zm0-11.38 1.06-1.06a.75.75 0 0 1 1.06 1.06L17.72 7.6a.75.75 0 1 1-1.06-1.06Zm-11.38 11.38 1.06-1.06a.75.75 0 1 1 1.06 1.06L6.34 18.98a.75.75 0 0 1-1.06-1.06ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        // Moon icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M21 12.79A8.25 8.25 0 0 1 11.21 3 6.75 6.75 0 1 0 21 12.79Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}

