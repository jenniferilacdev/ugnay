"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";

import {
  getResident,
  getOrganizations,
  verifyResident,
  transferResident,
  type ResidentDetail,
} from "@/lib/api";
import { VerificationBadge } from "@/components/verification-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

const VERIFICATION_STATUSES = ["Verified", "UnderReview", "Rejected", "Suspended", "Matched"];

function VerifyDialog({ resident }: { resident: ResidentDetail }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Verified");
  const [method, setMethod] = useState("");
  const [remarks, setRemarks] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      verifyResident(resident.id, { status, method: method || null, remarks: remarks || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resident", resident.id] });
      qc.invalidateQueries({ queryKey: ["residents"] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Verify</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify resident</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Decision</Label>
            <Select value={status} onValueChange={(v) => setStatus(v ?? "Verified")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERIFICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="method">Method</Label>
            <Input id="method" placeholder="e.g. Barangay ID" value={method} onChange={(e) => setMethod(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Record decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({ resident }: { resident: ResidentDetail }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");

  const barangays = useQuery({
    queryKey: ["organizations", "flat", "Barangay"],
    queryFn: ({ signal }) => getOrganizations("Barangay", signal),
  });

  const mutation = useMutation({
    mutationFn: () => transferResident(resident.id, { toOrganizationId: organizationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resident", resident.id] });
      qc.invalidateQueries({ queryKey: ["residents"] });
      setOpen(false);
      setOrganizationId("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">Transfer</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer residency</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>Destination barangay</Label>
          <Select value={organizationId} onValueChange={(v) => setOrganizationId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select barangay">
                {(value) =>
                  value ? (barangays.data?.find((b) => b.id === value)?.name ?? "") : "Select barangay"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {barangays.data?.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            The current residency is closed and preserved as history (spec §14).
          </p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={() => mutation.mutate()} disabled={!organizationId || mutation.isPending}>
            {mutation.isPending ? "Transferring…" : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ResidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["resident", id],
    queryFn: ({ signal }) => getResident(id, signal),
    retry: false,
  });

  if (query.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Resident not found or not in your scope.</p>
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
                <h1 className="text-2xl font-semibold tracking-tight">{r.fullName}</h1>
                <VerificationBadge status={r.verificationStatus} />
                {r.status !== "Active" && <Badge variant="secondary">{r.status}</Badge>}
              </div>
              <p className="font-mono text-sm text-muted-foreground">{r.referenceNumber}</p>
            </div>
            <div className="flex gap-2">
              <VerifyDialog resident={r} />
              <TransferDialog resident={r} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Sex" value={r.sex} />
                  <Field label="Civil status" value={r.civilStatus} />
                  <Field label="Occupation" value={r.occupation} />
                  <Field label="Education" value={r.education} />
                  {r.sensitive && (
                    <>
                      <Field label="Birth date" value={r.sensitive.birthDate} />
                      <Field label="Birth place" value={r.sensitive.birthPlace} />
                      <Field label="Email" value={r.sensitive.contactEmail} />
                      <Field label="Phone" value={r.sensitive.contactPhone} />
                    </>
                  )}
                </dl>
                {!r.sensitive && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Sensitive fields hidden (requires resident.view_sensitive).
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Verification</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Status" value={<VerificationBadge status={r.verificationStatus} />} />
                  <Field label="Method" value={r.verificationMethod} />
                  <Field
                    label="Verified at"
                    value={r.verifiedAtUtc ? new Date(r.verifiedAtUtc).toLocaleString() : "—"}
                  />
                  <Field label="Remarks" value={r.verificationRemarks} />
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Classifications &amp; employment</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Field label="Voter's ID" value={r.classifications.voterId} />
                <Field
                  label="Solo Parent"
                  value={r.classifications.isSoloParent ? (r.classifications.soloParentId ?? "Yes") : "No"}
                />
                <Field
                  label="Senior Citizen"
                  value={r.classifications.isSeniorCitizen ? (r.classifications.seniorCitizenId ?? "Yes") : "No"}
                />
                <Field
                  label="PWD"
                  value={r.classifications.hasDisability ? (r.classifications.disabilityId ?? "Yes") : "No"}
                />
                {r.classifications.hasDisability && (
                  <Field label="Disability type" value={r.classifications.disabilityType} />
                )}
                <Field label="Employment" value={r.classifications.employmentStatus} />
                {r.classifications.employedType && (
                  <Field label="Employed type" value={r.classifications.employedType} />
                )}
                {r.classifications.unemployedType && (
                  <Field label="Unemployed type" value={r.classifications.unemployedType} />
                )}
              </dl>
              {r.assistancePrograms.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Assistance:</span>
                  {r.assistancePrograms.map((p) => (
                    <Badge key={p.id} variant="secondary" title={p.name}>{p.code}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Residency history</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barangay</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.residencies.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{res.organizationName}</TableCell>
                      <TableCell className="text-muted-foreground">{res.address ?? "—"}</TableCell>
                      <TableCell>{res.startDate}</TableCell>
                      <TableCell>{res.endDate ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={res.status === "Current" ? "default" : "outline"}>
                          {res.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/residents" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-4" />
      Residents
    </Link>
  );
}
