"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";

import {
  getRegistration,
  approveRegistration,
  rejectRegistration,
} from "@/lib/api";
import { VerificationBadge } from "@/components/verification-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function RegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [remarks, setRemarks] = useState("");

  const query = useQuery({
    queryKey: ["registration", id],
    queryFn: ({ signal }) => getRegistration(id, signal),
    retry: false,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["registrations"] });
    qc.invalidateQueries({ queryKey: ["residents"] });
  };

  const approve = useMutation({
    mutationFn: (residentId?: string) =>
      approveRegistration(id, { residentId: residentId ?? null, remarks: remarks || null }),
    onSuccess: (res) => {
      invalidate();
      router.push(`/residents/${res.resultResidentId}`);
    },
  });

  const reject = useMutation({
    mutationFn: () => rejectRegistration(id, remarks || null),
    onSuccess: () => {
      invalidate();
      router.push("/registrations");
    },
  });

  if (query.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Registration not found or not in your scope.</p>
      </div>
    );
  }

  const r = query.data;
  const resolved = r && r.status !== "Submitted" && r.status !== "UnderReview";
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      {r && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {r.firstName} {r.lastName}
                </h1>
                <Badge variant="outline">{r.status}</Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">
                {r.referenceNumber} · {r.barangay}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Submitted details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Field label="Sex" value={r.sex} />
                <Field label="Birth date" value={r.birthDate} />
                <Field label="Address" value={r.address} />
                <Field label="Email" value={r.contactEmail} />
                <Field label="Phone" value={r.contactPhone} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Possible existing residents</CardTitle>
              <CardDescription>
                Matched by surname and birth date or first name (spec §12). Link one
                to avoid creating a duplicate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {r.matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No likely matches found.</p>
              ) : (
                <ul className="divide-y">
                  {r.matches.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-4 py-2.5">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-medium">{m.fullName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{m.referenceNumber}</span>
                        <VerificationBadge status={m.verificationStatus} />
                      </div>
                      {!resolved && (
                        <Button size="xs" variant="outline" disabled={busy} onClick={() => approve.mutate(m.id)}>
                          Approve &amp; link
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {resolved ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                This registration is <span className="font-medium text-foreground">{r.status}</span>.
                {r.reviewRemarks && <> Remarks: {r.reviewRemarks}</>}
                {r.resultResidentId && (
                  <>
                    {" "}
                    <Link href={`/residents/${r.resultResidentId}`} className="text-primary hover:underline">
                      View resident
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Decision</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button disabled={busy} onClick={() => approve.mutate(undefined)}>
                    Approve as new resident
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => reject.mutate()}>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/registrations" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-4" />
      Registrations
    </Link>
  );
}
