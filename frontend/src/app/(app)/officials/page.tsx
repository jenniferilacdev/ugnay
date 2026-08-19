"use client";

import { useQuery } from "@tanstack/react-query";
import { getOfficials } from "@/lib/api";
import { NewOfficialDialog } from "@/components/new-official-dialog";
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

export default function OfficialsPage() {
  const query = useQuery({
    queryKey: ["officials"],
    queryFn: ({ signal }) => getOfficials(signal),
  });

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

      <Card>
        <CardContent className="pt-6">
          {query.isError && (
            <p className="text-sm text-destructive">Could not load officials.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Term start</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {query.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No officials yet. Add the first one.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((o) => {
                const current = o.terms[0];
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.fullName}</TableCell>
                    <TableCell>{current?.position ?? "—"}</TableCell>
                    <TableCell>{current?.organizationName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {current?.startDate ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
