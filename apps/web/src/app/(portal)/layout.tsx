export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white p-4 md:block">
        <div className="mb-6 px-2 text-sm font-semibold text-zinc-900">
          HRIS Gasela Motor
        </div>
        <nav className="space-y-1 text-sm text-zinc-600">
          <p className="px-2 py-1 text-xs uppercase tracking-wide text-zinc-400">
            Navigasi per-role (Fase 1)
          </p>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}