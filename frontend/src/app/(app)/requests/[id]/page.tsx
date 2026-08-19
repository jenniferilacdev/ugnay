"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";

import { getRequest, transitionRequest } from "@/lib/api";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

// A destructive-looking action for reject/cancel; primary for the rest.
const DESTRUCTIVE = new Set(["reject", "cancel"]);

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [remarks, setRemarks] = useState("");

  const query = useQuery({
    queryKey: ["request", id],
    queryFn: ({ signal }) => getRequest(id, signal),
    retry: false,
  });

  const transition = useMutation({
    mutationFn: (action: string) => transitionRequest(id, { action, remarks: remarks || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["request", id] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      setRemarks("");
    },
  });

  if (query.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Request not found or not in your scope.</p>
      </div>
    );
  }

  const r = query.data;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      {r && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{r.title}</h1>
                <RequestStatusBadge status={r.status} />
                <Badge variant="outline">{r.priority}</Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">
                {r.referenceNumber} · {r.category} · {r.organization}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Field label="Resident" value={r.resident} />
                <Field label="Created" value={new Date(r.createdAtUtc).toLocaleString()} />
                <Field label="Completed" value={r.completedAtUtc ? new Date(r.completedAtUtc).toLocaleString() : "—"} />
                <div className="col-span-2 md:col-span-3">
                  <Field label="Description" value={r.description} />
                </div>
              </dl>
            </CardContent>
          </Card>

          {r.availableActions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Take action</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="remarks">Remarks (optional)</Label>
                  <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.availableActions.map((a) => (
                    <Button
                      key={a}
                      size="sm"
                      variant={DESTRUCTIVE.has(a) ? "outline" : "default"}
                      disabled={transition.isPending}
                      onClick={() => transition.mutate(a)}
                      className="capitalize"
                    >
                      {a}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative flex flex-col gap-4 border-l pl-5">
                {r.timeline.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[1.42rem] top-1 size-2.5 rounded-full bg-primary" />
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="font-medium">{e.type}</span>
                      {e.fromStatus && e.toStatus && (
                        <span className="text-xs text-muted-foreground">
                          {e.fromStatus} → {e.toStatus}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(e.createdAtUtc).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {e.actorName ?? "System"}
                      {e.remarks ? ` — ${e.remarks}` : ""}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/requests" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-4" />
      Requests
    </Link>
  );
}
