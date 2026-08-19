"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiInfo, getTenants } from "@/lib/api";

function StatusDot({ ok, pending }: { ok: boolean; pending: boolean }) {
  const color = pending
    ? "bg-amber-400"
    : ok
      ? "bg-emerald-500"
      : "bg-red-500";
  const label = pending ? "Checking" : ok ? "Connected" : "Unavailable";
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      <span className="tabular-nums text-black/60 dark:text-white/60">{label}</span>
    </span>
  );
}

export function SystemStatus() {
  const info = useQuery({ queryKey: ["api", "info"], queryFn: ({ signal }) => getApiInfo(signal) });
  const tenants = useQuery({ queryKey: ["tenants"], queryFn: ({ signal }) => getTenants(signal) });

  return (
    <section className="w-full max-w-xl rounded-lg border border-black/10 dark:border-white/15 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
          System status
        </h2>
        <StatusDot ok={info.isSuccess} pending={info.isPending} />
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-black/50 dark:text-white/50">API</dt>
        <dd className="font-mono">{info.data?.name ?? "—"}</dd>
        <dt className="text-black/50 dark:text-white/50">Version</dt>
        <dd className="font-mono">{info.data?.version ?? "—"}</dd>
        <dt className="text-black/50 dark:text-white/50">Environment</dt>
        <dd className="font-mono">{info.data?.environment ?? "—"}</dd>
      </dl>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
            Tenants
          </h3>
          <StatusDot ok={tenants.isSuccess} pending={tenants.isPending} />
        </div>
        {tenants.data && tenants.data.length > 0 ? (
          <ul className="mt-3 divide-y divide-black/5 dark:divide-white/10">
            {tenants.data.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span>{t.name}</span>
                <span className="font-mono text-black/50 dark:text-white/50">/{t.slug}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-black/50 dark:text-white/50">
            {tenants.isPending ? "Loading…" : "No tenants yet."}
          </p>
        )}
      </div>
    </section>
  );
}
