"use client";

import { useQuery } from "@tanstack/react-query";
import { getApiInfo, getTenants } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ ok, pending }: { ok: boolean; pending: boolean }) {
  if (pending) return <Badge variant="secondary">Checking…</Badge>;
  return ok ? (
    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
      Connected
    </Badge>
  ) : (
    <Badge variant="destructive">Unavailable</Badge>
  );
}

export function SystemStatus() {
  const info = useQuery({ queryKey: ["api", "info"], queryFn: ({ signal }) => getApiInfo(signal) });
  const tenants = useQuery({ queryKey: ["tenants"], queryFn: ({ signal }) => getTenants(signal) });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            API status
          </CardTitle>
          <StatusBadge ok={info.isSuccess} pending={info.isPending} />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Service</dt>
            <dd className="font-mono">{info.data?.name ?? "—"}</dd>
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono">{info.data?.version ?? "—"}</dd>
            <dt className="text-muted-foreground">Environment</dt>
            <dd className="font-mono">{info.data?.environment ?? "—"}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tenants
          </CardTitle>
          <StatusBadge ok={tenants.isSuccess} pending={tenants.isPending} />
        </CardHeader>
        <CardContent>
          {tenants.data && tenants.data.length > 0 ? (
            <ul className="divide-y">
              {tenants.data.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm first:pt-0">
                  <span>{t.name}</span>
                  <span className="font-mono text-muted-foreground">/{t.slug}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tenants.isPending ? "Loading…" : "No tenants yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
