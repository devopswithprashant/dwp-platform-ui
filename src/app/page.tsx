import Link from "next/link";
import { getAuthUser } from "@/lib/auth/auth.server";

export default async function HomePage() {
  const user = await getAuthUser();

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center">
      <div className="flex-1 space-y-6">
        <p className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-300">
          DevOps • Cloud • Systems
        </p>
        <div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            DevOps With Prashant —
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {" "}
              Engineering stories & playbooks
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Essays and deep dives on real-world DevOps, cloud architecture,
            observability, and system design — written for engineers who ship.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/blogs"
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Read the blog
          </Link>
          <Link
            href={user ? "/blogs/new" : "/login?callbackUrl=/blogs/new"}
            className="inline-flex items-center rounded-full border border-gray-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-900"
          >
            Write a post
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-1 justify-center md:mt-0">
        <div className="relative w-full max-w-sm">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-blue-500/40 via-cyan-400/20 to-indigo-500/40 blur-xl opacity-70 dark:opacity-90" />
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Live pipeline
              </p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                Healthy
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span>deploy/api-service</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-300">
                  passed · 3m ago
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full w-5/6 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" />
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span>rollout/eu-west-prod</span>
                <span className="text-[11px] text-gray-400">in progress</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-gray-900 px-3 py-2 text-[11px] font-mono text-gray-100 dark:bg-black">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">
                tail -f deploy.log
              </div>
              <p className="truncate text-emerald-300">
                ✔ rollout complete · all regions healthy · latency p95 112ms
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}