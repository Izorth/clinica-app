"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Calendar, Users, Stethoscope, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type User = { nombre: string; rol: string; initials: string };

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
    queryKey: null,
    apiPath: null,
  },
  {
    label: "Agenda",
    href: "/dashboard/agenda",
    icon: Calendar,
    exact: false,
    queryKey: null,
    apiPath: null,
  },
  {
    label: "Pacientes",
    href: "/dashboard/pacientes",
    icon: Users,
    exact: false,
    queryKey: ["pacientes"] as string[],
    apiPath: "/api/pacientes",
  },
  {
    label: "Médicos",
    href: "/dashboard/medicos",
    icon: Stethoscope,
    exact: false,
    queryKey: ["medicos"] as string[],
    apiPath: "/api/medicos",
  },
] as const;

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  function prefetch(apiPath: string | null, queryKey: readonly string[] | null) {
    if (!apiPath || !queryKey) return;
    void queryClient.prefetchQuery({
      queryKey: [...queryKey],
      queryFn: async () => {
        const res = await fetch(apiPath);
        return res.json();
      },
    });
  }

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[--color-border-stone] bg-white dark:border-stone-800 dark:bg-stone-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pb-6 pt-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[--color-text]">
          <Stethoscope className="h-3.5 w-3.5 text-white dark:text-stone-900" />
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-tight text-[--color-text]">
            Clínica
          </p>
          <p className="text-[11px] text-[--color-text-subtle]">Panel de gestión</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onMouseEnter={() => prefetch(item.apiPath, item.queryKey)}
              className={[
                "flex items-center gap-2.5 rounded-[6px] px-3 py-[7px] text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[--color-brand-subtle] text-[--color-brand]"
                  : "text-[--color-text-muted] hover:bg-stone-50 hover:text-[--color-text] dark:hover:bg-stone-800 dark:hover:text-stone-100",
              ].join(" ")}
            >
              <Icon
                className={["h-[15px] w-[15px] shrink-0", isActive ? "opacity-100" : "opacity-60"].join(" ")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign-out */}
      <div className="border-t border-[--color-border-stone] px-4 py-3 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[--color-brand-subtle] text-[11px] font-bold text-[--color-brand]">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[--color-text]">{user.nombre}</p>
            <p className="truncate text-[11px] text-[--color-text-subtle]">{user.rol}</p>
          </div>
          <button
            type="button"
            title="Cerrar sesión"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 rounded-[4px] p-1 text-[--color-text-muted] transition-colors hover:bg-stone-100 hover:text-[--color-text] dark:hover:bg-stone-800"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
