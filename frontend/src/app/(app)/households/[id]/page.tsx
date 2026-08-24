"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, CrownIcon } from "lucide-react";

import {
  getHousehold,
  getResidents,
  addHouseholdMember,
  removeHouseholdMember,
  changeHouseholdHead,
  type HouseholdDetail,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const RELATIONSHIPS = ["Spouse", "Son", "Daughter", "Parent", "Sibling", "Relative", "Other"];

function AddMemberDialog({ household }: { household: HouseholdDetail }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [residentId, setResidentId] = useState("");
  const [relationship, setRelationship] = useState("Son");

  const residents = useQuery({ queryKey: ["residents"], queryFn: ({ signal }) => getResidents(undefined, signal) });
  const memberResidentIds = new Set(household.members.filter((m) => m.status === "Active").map((m) => m.residentId));

  const mutation = useMutation({
    mutationFn: () => addHouseholdMember(household.id, { residentId, relationship }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household", household.id] });
      qc.invalidateQueries({ queryKey: ["households"] });
      setOpen(false);
      setResidentId("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Add member</Button>} />
      <DialogContent>
        <DialogHeader><DialogTitle>Add member</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Resident</Label>
            <Select value={residentId} onValueChange={(v) => setResidentId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select resident">
                  {(value) => (value ? (residents.data?.find((r) => r.id === value)?.fullName ?? "") : "Select resident")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {residents.data
                  ?.filter((r) => !memberResidentIds.has(r.id))
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.fullName} · {r.referenceNumber}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Relationship</Label>
            <Select value={relationship} onValueChange={(v) => setRelationship(v ?? "Other")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={() => mutation.mutate()} disabled={!residentId || mutation.isPending}>
            {mutation.isPending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HouseholdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["household", id],
    queryFn: ({ signal }) => getHousehold(id, signal),
    retry: false,
  });

  const changeHead = useMutation({
    mutationFn: (memberId: string) => changeHouseholdHead(id, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["household", id] }),
  });
  const removeMember = useMutation({
    mutationFn: (memberId: string) => removeHouseholdMember(id, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household", id] });
      qc.invalidateQueries({ queryKey: ["households"] });
    },
  });

  if (query.isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Household not found or not in your scope.</p>
      </div>
    );
  }

  const h = query.data;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      {h && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{h.barangay}</h1>
                <Badge variant="outline">{h.status}</Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">{h.referenceNumber}</p>
            </div>
            <AddMemberDialog household={h} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Household</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">House no.</dt><dd className="text-sm">{h.houseNumber ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Street</dt><dd className="text-sm">{h.street ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Zone</dt><dd className="text-sm">{h.zone ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Purok</dt><dd className="text-sm">{h.purok ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Housing</dt><dd className="text-sm">{h.housingType ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Contact</dt><dd className="text-sm">{h.contactPhone ?? "—"}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Members</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {h.members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          {m.isHead && <CrownIcon className="size-3.5 text-amber-500" />}
                          {m.residentName}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{m.referenceNumber}</TableCell>
                      <TableCell>{m.relationship}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === "Active" ? "secondary" : "outline"}>{m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.status === "Active" && (
                          <div className="flex justify-end gap-2">
                            {!m.isHead && (
                              <Button size="xs" variant="ghost" onClick={() => changeHead.mutate(m.id)} disabled={changeHead.isPending}>
                                Make head
                              </Button>
                            )}
                            <Button size="xs" variant="ghost" onClick={() => removeMember.mutate(m.id)} disabled={removeMember.isPending}>
                              Remove
                            </Button>
                          </div>
                        )}
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
    <Link href="/households" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-4" />
      Households
    </Link>
  );
}
