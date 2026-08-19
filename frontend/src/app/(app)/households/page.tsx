"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getHouseholds } from "@/lib/api";
import { NewHouseholdDialog } from "@/components/new-household-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HouseholdsPage() {
  const query = useQuery({
    queryKey: ["households"],
    queryFn: ({ signal }) => getHouseholds(signal),
  });

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

      <Card>
        <CardContent className="pt-6">
          {query.isError && (
            <p className="text-sm text-destructive">Could not load households.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
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
                    No households yet. Register the first one.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/households/${h.id}`} className="hover:text-primary hover:underline">
                      {h.referenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{h.barangay}</TableCell>
                  <TableCell>{h.headName ?? "—"}</TableCell>
                  <TableCell>{h.memberCount}</TableCell>
                  <TableCell><Badge variant="outline">{h.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
