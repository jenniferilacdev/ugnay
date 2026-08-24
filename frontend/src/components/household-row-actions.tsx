"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  ApiError,
  deleteHousehold,
  getHousehold,
  updateHousehold,
  type HouseholdDetail,
  type HouseholdSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";

export function HouseholdRowActions({ household }: { household: HouseholdSummary }) {
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
          <DropdownMenuItem render={<Link href={`/households/${household.id}`} />}>
            View household
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(household.referenceNumber)}>
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

      <EditHouseholdDialog household={household} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteHouseholdDialog household={household} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}

function EditHouseholdDialog({
  household,
  open,
  onOpenChange,
}: {
  household: HouseholdSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useQuery({
    queryKey: ["household", household.id],
    queryFn: ({ signal }) => getHousehold(household.id, signal),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit household</DialogTitle>
          <DialogDescription>Update the household&apos;s address and contact details.</DialogDescription>
        </DialogHeader>
        {detail.isPending ? (
          <Skeleton className="h-52 w-full" />
        ) : detail.data ? (
          <EditHouseholdForm household={household} detail={detail.data} onDone={() => onOpenChange(false)} />
        ) : (
          <p className="text-sm text-destructive">Could not load household.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditHouseholdForm({
  household,
  detail,
  onDone,
}: {
  household: HouseholdSummary;
  detail: HouseholdDetail;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [houseNumber, setHouseNumber] = useState(detail.houseNumber ?? "");
  const [street, setStreet] = useState(detail.street ?? "");
  const [zone, setZone] = useState(detail.zone ?? "");
  const [housingType, setHousingType] = useState(detail.housingType ?? "");
  const [contactPhone, setContactPhone] = useState(detail.contactPhone ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      updateHousehold(household.id, {
        houseNumber: houseNumber || null,
        street: street || null,
        zone: zone || null,
        housingType: housingType || null,
        contactPhone: contactPhone || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["households"] });
      qc.invalidateQueries({ queryKey: ["household", household.id] });
      onDone();
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Could not update household." : null;

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="House no."><Input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} /></Field>
        <Field label="Street"><Input value={street} onChange={(e) => setStreet(e.target.value)} /></Field>
        <Field label="Zone"><Input value={zone} onChange={(e) => setZone(e.target.value)} /></Field>
      </div>
      <Field label="Housing type"><Input placeholder="e.g. Concrete" value={housingType} onChange={(e) => setHousingType(e.target.value)} /></Field>
      <Field label="Contact number"><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></Field>

      {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteHouseholdDialog({
  household,
  open,
  onOpenChange,
}: {
  household: HouseholdSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteHousehold(household.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["households"] });
      onOpenChange(false);
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "Could not delete household." : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) mutation.reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete household?</DialogTitle>
          <DialogDescription>
            This removes <span className="font-medium text-foreground">{household.referenceNumber}</span> from the
            active list (the record is archived, not permanently erased).
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
