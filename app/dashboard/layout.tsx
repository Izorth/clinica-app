export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/dashboard/app-shell";
import { authOptions } from "@/lib/auth";
import { rolLabel } from "@/lib/utils/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const nombre = session.user.name ?? session.user.email ?? "Usuario";
  const rol = session.user.rol ? rolLabel(session.user.rol) : "—";
  const initials = nombre
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell user={{ nombre, rol, initials }}>
      {children}
    </AppShell>
  );
}
