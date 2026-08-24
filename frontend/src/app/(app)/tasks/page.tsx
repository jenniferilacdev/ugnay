"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTasks, updateTask } from "@/lib/api";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUSES = ["Open", "InProgress", "Done", "Cancelled"];

const STATUS_STYLE: Record<string, string> = {
  InProgress: "bg-blue-600 text-white hover:bg-blue-600",
  Done: "bg-emerald-600 text-white hover:bg-emerald-600",
  Cancelled: "bg-muted-foreground/70 text-white hover:bg-muted-foreground/70",
};

function StatusSelect({ id, status }: { id: string; status: string }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (next: string) => updateTask(id, { status: next }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  return (
    <Select value={status} onValueChange={(v) => v && mutation.mutate(v)} disabled={mutation.isPending}>
      <SelectTrigger size="sm" className="w-[9rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function TasksPage() {
  const [mine, setMine] = useState(false);
  const [status, setStatus] = useState("");

  const query = useQuery({
    queryKey: ["tasks", { mine, status }],
    queryFn: ({ signal }) => getTasks({ mine, status: status || undefined }, signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Internal work items for staff (spec §57).</p>
        </div>
        <NewTaskDialog />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={mine ? "default" : "outline"} onClick={() => setMine((m) => !m)}>
          Assigned to me
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        {["", ...STATUSES].map((s) => (
          <Button key={s || "all"} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
            {s || "All"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {query.isError && <p className="text-sm text-destructive">Could not load tasks.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Related</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {query.data?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">No tasks.</TableCell></TableRow>
              )}
              {query.data?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="text-xs">
                    {t.relatedRecordType === "Request" && t.relatedRecordId ? (
                      <Link href={`/requests/${t.relatedRecordId}`} className="text-primary hover:underline">
                        Request
                      </Link>
                    ) : (
                      t.relatedRecordType ?? "—"
                    )}
                  </TableCell>
                  <TableCell>{t.assignedToName ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{t.priority}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{t.dueDate ?? "—"}</TableCell>
                  <TableCell>
                    {t.status in STATUS_STYLE ? (
                      <span className="inline-flex items-center gap-2">
                        <Badge className={STATUS_STYLE[t.status]}>{t.status}</Badge>
                        <StatusSelect id={t.id} status={t.status} />
                      </span>
                    ) : (
                      <StatusSelect id={t.id} status={t.status} />
                    )}
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
