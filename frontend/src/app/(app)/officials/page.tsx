"use client";

import { useQuery } from "@tanstack/react-query";
import { getOfficials } from "@/lib/api";
import { useActingScope } from "@/lib/scope-context";
import { NewOfficialDialog } from "@/components/new-official-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { officialColumns } from "./columns";

export default function OfficialsPage() {
  const { actingOrgId } = useActingScope();
  const query = useQuery({
    queryKey: ["officials", actingOrgId],
    queryFn: ({ signal }) => getOfficials(actingOrgId, signal),
  });

  const data = query.data ?? [];
  const positionOptions = Array.from(
    new Set(data.map((o) => o.terms[0]?.position).filter(Boolean) as string[]),
  ).map((p) => ({ label: p, value: p }));
  const statusOptions = Array.from(new Set(data.map((o) => o.status))).map(
    (s) => ({ label: s, value: s }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Officials</h1>
          <p className="text-sm text-muted-foreground">
            Officials and their terms of service (spec §36).
          </p>
        </div>
        <NewOfficialDialog />
      </div>

      {query.isError && (
        <p className="text-sm text-destructive">Could not load officials.</p>
      )}

      {query.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={officialColumns}
          data={data}
          searchColumnId="fullName"
          searchPlaceholder="Filter officials…"
          facets={[
            ...(positionOptions.length > 1
              ? [{ columnId: "position", title: "Position", options: positionOptions }]
              : []),
            ...(statusOptions.length > 1
              ? [{ columnId: "status", title: "Status", options: statusOptions }]
              : []),
          ]}
          emptyMessage="No officials yet. Add the first one."
        />
      )}
    </div>
  );
}
