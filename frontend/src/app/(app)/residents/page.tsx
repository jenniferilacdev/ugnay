"use client";

import { useQuery } from "@tanstack/react-query";
import { getResidents } from "@/lib/api";
import { useActingScope } from "@/lib/scope-context";
import { NewResidentDialog } from "@/components/new-resident-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { residentColumns } from "./columns";

const SEX_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Unspecified", value: "Unspecified" },
];

const VERIFICATION_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Verified", value: "Verified" },
  { label: "Rejected", value: "Rejected" },
  { label: "Suspended", value: "Suspended" },
];

export default function ResidentsPage() {
  const { actingOrgId } = useActingScope();
  const query = useQuery({
    queryKey: ["residents", actingOrgId],
    queryFn: ({ signal }) => getResidents(actingOrgId, signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Residents</h1>
          <p className="text-sm text-muted-foreground">
            Resident registry with verification and residency history (spec §32).
          </p>
        </div>
        <NewResidentDialog />
      </div>

      {query.isError && (
        <p className="text-sm text-destructive">Could not load residents.</p>
      )}

      {query.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={residentColumns}
          data={query.data ?? []}
          searchColumnId="fullName"
          searchPlaceholder="Filter residents…"
          facets={[
            { columnId: "sex", title: "Sex", options: SEX_OPTIONS },
            {
              columnId: "verificationStatus",
              title: "Verification",
              options: VERIFICATION_OPTIONS,
            },
          ]}
          emptyMessage="No residents yet. Register the first one."
        />
      )}
    </div>
  );
}
