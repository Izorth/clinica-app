import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-3 w-56" />
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-28" />
            </li>
          ))}
        </ul>
      </section>
      <section>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-3 w-48" />
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
