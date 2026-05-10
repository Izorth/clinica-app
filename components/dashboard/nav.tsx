"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Pacientes",
    href: "/dashboard/pacientes",
    icon: Users,
    queryKey: ["pacientes"],
    apiPath: "/api/pacientes",
    disabled: false,
  },
  {
    label: "Agenda",
    href: "/dashboard/agenda",
    icon: Calendar,
    queryKey: null,
    apiPath: null,
    disabled: false,
  },
  {
    label: "Médicos",
    href: "/dashboard/medicos",
    icon: Stethoscope,
    queryKey: ["medicos"],
    apiPath: "/api/medicos",
    disabled: false,
  },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  function prefetch(apiPath: string | null, queryKey: readonly string[] | null) {
    if (!apiPath || !queryKey) return;
    void queryClient.prefetchQuery({
      queryKey,
      queryFn: async () => {
        const res = await fetch(apiPath);
        return res.json();
      },
    });
  }

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {pathname !== "/dashboard" && (
          <Link
            href="/dashboard"
            className="mr-3 flex items-center whitespace-nowrap border-b-2 border-transparent py-3 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
          >
            ← Dashboard
          </Link>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <span
                key={item.href}
                title="Próximamente"
                className="flex cursor-not-allowed items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm font-medium text-zinc-400 select-none dark:text-zinc-600"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            );
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => prefetch(item.apiPath, item.queryKey)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
