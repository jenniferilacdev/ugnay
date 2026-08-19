import { SystemStatus } from "@/components/system-status";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <header className="max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">UGNAY</h1>
        <p className="mt-3 text-balance text-black/60 dark:text-white/60">
          Integrated Local Government Information, Operations &amp; Resident
          Services Platform
        </p>
        <p className="mt-2 text-sm text-black/40 dark:text-white/40">
          Phase 0 — Foundation. Next.js · ASP.NET Core · PostgreSQL
        </p>
      </header>

      <SystemStatus />
    </main>
  );
}
