"use client";

import { useQuery } from "@tanstack/react-query";
import { getHouseholds } from "@/lib/api";
import { useActingScope } from "@/lib/scope-context";
import { NewHouseholdDialog } from "@/components/new-household-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { householdColumns } from "./columns";

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

export default function HouseholdsPage() {
  const { actingOrgId } = useActingScope();
  const query = useQuery({
    queryKey: ["households", actingOrgId],
    queryFn: ({ signal }) => getHouseholds(actingOrgId, signal),
  });

  const barangayOptions = Array.from(
    new Set((query.data ?? []).map((h) => h.barangay)),
  ).map((b) => ({ label: b, value: b }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Households</h1>
          <p className="text-sm text-muted-foreground">
            Households and their members (spec §33).
          </p>
        </div>
        <NewHouseholdDialog />
      </div>

      {query.isError && (
        <p className="text-sm text-destructive">Could not load households.</p>
      )}

      {query.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={householdColumns}
          data={query.data ?? []}
          searchColumnId="headName"
          searchPlaceholder="Filter by head…"
          facets={[
            ...(barangayOptions.length > 1
              ? [{ columnId: "barangay", title: "Barangay", options: barangayOptions }]
              : []),
            { columnId: "status", title: "Status", options: STATUS_OPTIONS },
          ]}
          emptyMessage="No households yet. Register the first one."
        />
      )}
    </div>
  );
}
