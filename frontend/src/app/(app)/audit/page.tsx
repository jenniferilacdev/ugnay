"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function AuditPage() {
  const query = useQuery({
    queryKey: ["audit"],
    queryFn: ({ signal }) => getAuditLogs(signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Important actions recorded across your tenant (spec §74).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Most recent first, up to 100 entries.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isError && (
            <p className="text-sm text-destructive">Could not load audit logs.</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP</TableHead>
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
                    No audit entries yet.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatTime(entry.timestampUtc)}
                  </TableCell>
                  <TableCell>{entry.actorName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.action}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.entityType}
                    {entry.entityId ? `:${entry.entityId.slice(0, 8)}` : ""}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.ipAddress ?? "—"}
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
