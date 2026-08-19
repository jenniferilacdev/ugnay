"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRequests } from "@/lib/api";
import { NewRequestDialog } from "@/components/new-request-dialog";
import { RequestStatusBadge } from "@/components/request-status-badge";
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

const TABS = ["", "Submitted", "UnderReview", "Approved", "Completed", "Rejected"];

export default function RequestsPage() {
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["requests", status],
    queryFn: ({ signal }) => getRequests(status || undefined, signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
          <p className="text-sm text-muted-foreground">
            Service requests in the shared approval workflow (spec §31, §37).
          </p>
        </div>
        <NewRequestDialog />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t || "all"} size="sm" variant={status === t ? "default" : "outline"} onClick={() => setStatus(t)}>
            {t || "All"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {query.isError && <p className="text-sm text-destructive">Could not load requests.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {query.data?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">No requests.</TableCell></TableRow>
              )}
              {query.data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/requests/${r.id}`} className="hover:text-primary hover:underline">
                      {r.referenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/requests/${r.id}`} className="hover:text-primary hover:underline">
                      {r.title}
                    </Link>
                  </TableCell>
                  <TableCell>{r.resident ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.priority}</Badge></TableCell>
                  <TableCell><RequestStatusBadge status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
