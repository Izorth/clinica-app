import { Skeleton } from "@/components/ui/skeleton";

export function PacientesSkeleton() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-48 sm:max-w-xs" />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="ml-auto h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
