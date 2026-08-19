"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getResidents } from "@/lib/api";
import { NewResidentDialog } from "@/components/new-resident-dialog";
import { VerificationBadge } from "@/components/verification-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ResidentsPage() {
  const query = useQuery({
    queryKey: ["residents"],
    queryFn: ({ signal }) => getResidents(signal),
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

      <Card>
        <CardContent className="pt-6">
          {query.isError && (
            <p className="text-sm text-destructive">Could not load residents.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Verification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">Loading…</TableCell>
                </TableRow>
              )}
              {query.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No residents yet. Register the first one.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/residents/${r.id}`} className="hover:text-primary hover:underline">
                      {r.referenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/residents/${r.id}`} className="hover:text-primary hover:underline">
                      {r.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{r.sex}</TableCell>
                  <TableCell>{r.currentBarangay ?? "—"}</TableCell>
                  <TableCell>
                    <VerificationBadge status={r.verificationStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
