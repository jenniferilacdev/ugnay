"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRegistrations } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TABS = ["Submitted", "Approved", "Rejected"];

export default function RegistrationsPage() {
  const [status, setStatus] = useState("Submitted");
  const query = useQuery({
    queryKey: ["registrations", status],
    queryFn: ({ signal }) => getRegistrations(status, signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Registrations</h1>
        <p className="text-sm text-muted-foreground">
          Self-service resident registrations awaiting review (spec §12).
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={status === t ? "default" : "outline"}
            onClick={() => setStatus(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {query.isError && (
            <p className="text-sm text-destructive">Could not load registrations.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Submitted</TableHead>
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
                    No {status.toLowerCase()} registrations.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/registrations/${r.id}`} className="hover:text-primary hover:underline">
                      {r.referenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/registrations/${r.id}`} className="hover:text-primary hover:underline">
                      {r.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{r.barangay}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.createdAtUtc).toLocaleDateString()}
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
