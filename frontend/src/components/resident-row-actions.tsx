"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  ApiError,
  deleteResident,
  getResident,
  updateResident,
  type ResidentDetail,
  type ResidentSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const SEXES = ["Male", "Female", "Unspecified"];
const CIVIL = ["Single", "Married", "CommonLaw", "Widowed", "Divorced", "Separated", "Annulled", "Other"];

export function ResidentRowActions({ resident }: { resident: ResidentSummary }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground data-[popup-open]:bg-accent">
              <MoreHorizontalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={`/residents/${resident.id}`} />}>
            View resident
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(resident.referenceNumber)}>
            Copy reference
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon className="text-muted-foreground" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditResidentDialog resident={resident} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteResidentDialog resident={resident} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}

function EditResidentDialog({
  resident,
  open,
  onOpenChange,
}: {
  resident: ResidentSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useQuery({
    queryKey: ["resident", resident.id],
    queryFn: ({ signal }) => getResident(resident.id, signal),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit resident</DialogTitle>
          <DialogDescription>Update this resident&apos;s identity and contact details.</DialogDescription>
        </DialogHeader>
        {detail.isPending ? (
          <Skeleton className="h-72 w-full" />
        ) : detail.data ? (
          <EditResidentForm resident={resident} detail={detail.data} onDone={() => onOpenChange(false)} />
        ) : (
          <p className="text-sm text-destructive">Could not load resident.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditResidentForm({
  resident,
  detail,
  onDone,
}: {
  resident: ResidentSummary;
  detail: ResidentDetail;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [firstName, setFirstName] = useState(detail.firstName);
  const [middleName, setMiddleName] = useState(detail.middleName ?? "");
  const [lastName, setLastName] = useState(detail.lastName);
  const [suffix, setSuffix] = useState(detail.suffix ?? "");
  const [sex, setSex] = useState(detail.sex ?? "");
  const [civilStatus, setCivilStatus] = useState(detail.civilStatus ?? "");
  const [birthDate, setBirthDate] = useState(detail.sensitive?.birthDate?.slice(0, 10) ?? "");
  const [contactPhone, setContactPhone] = useState(detail.sensitive?.contactPhone ?? "");
  const [voterId, setVoterId] = useState(detail.classifications.voterId ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      updateResident(resident.id, {
        firstName,
        middleName: middleName || null,
        lastName,
        suffix: suffix || null,
        sex: sex || null,
        civilStatus: civilStatus || null,
        birthDate: birthDate || null,
        contactPhone: contactPhone || null,
        voterId: voterId || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["residents"] });
      qc.invalidateQueries({ queryKey: ["resident", resident.id] });
      onDone();
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Could not update resident." : null;
  const canSubmit = firstName.trim() && lastName.trim();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name"><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
        <Field label="Middle name"><Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} /></Field>
        <Field label="Last name"><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
        <Field label="Extension name"><Input value={suffix} onChange={(e) => setSuffix(e.target.value)} /></Field>
        <Field label="Sex"><PlainSelect value={sex} onChange={setSex} options={SEXES} placeholder="Select sex" /></Field>
        <Field label="Civil status"><PlainSelect value={civilStatus} onChange={setCivilStatus} options={CIVIL} placeholder="Select status" /></Field>
        <Field label="Date of birth"><DatePicker value={birthDate} onChange={setBirthDate} placeholder="Select date" /></Field>
        <Field label="Contact number"><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></Field>
        <Field label="Voter's ID"><Input value={voterId} onChange={(e) => setVoterId(e.target.value)} /></Field>
      </div>

      {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
        <Button type="submit" disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteResidentDialog({
  resident,
  open,
  onOpenChange,
}: {
  resident: ResidentSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteResident(resident.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["residents"] });
      onOpenChange(false);
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Could not delete resident." : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) mutation.reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete resident?</DialogTitle>
          <DialogDescription>
            This removes <span className="font-medium text-foreground">{resident.fullName}</span> from the active
            registry (the record is archived, not permanently erased).
          </DialogDescription>
        </DialogHeader>
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PlainSelect({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
