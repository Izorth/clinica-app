import { AppSidebar } from "./app-sidebar";

type User = { nombre: string; rol: string; initials: string };

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)] dark:bg-stone-950">
      <AppSidebar user={user} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
