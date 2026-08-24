"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  ApiError,
  deleteOfficial,
  updateOfficial,
  type Official,
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

const POSITIONS = [
  "Barangay Captain",
  "Barangay Secretary",
  "Barangay Treasurer",
  "Kagawad",
  "SK Chairperson",
];

export function OfficialRowActions({ official }: { official: Official }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground data-[popup-open]:bg-accent"
            >
              <MoreHorizontalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon className="text-muted-foreground" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditOfficialDialog official={official} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteOfficialDialog official={official} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}

function EditOfficialDialog({
  official,
  open,
  onOpenChange,
}: {
  official: Official;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const term = official.terms[0];
  const [fullName, setFullName] = useState(official.fullName);
  const [position, setPosition] = useState(term?.position ?? "");
  const [startDate, setStartDate] = useState(term?.startDate?.slice(0, 10) ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      updateOfficial(official.id, {
        fullName,
        position,
        startDate: startDate || null,
        contactEmail: official.contactEmail,
        contactPhone: official.contactPhone,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officials"] });
      onOpenChange(false);
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not update official."
        : null;

  const canSubmit = fullName.trim() && position;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) mutation.reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit official</DialogTitle>
          <DialogDescription>Update this official and their current term.</DialogDescription>
        </DialogHeader>

        <form
          id="edit-official-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="editFullName">Full name</Label>
            <Input id="editFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Position</Label>
            <Select value={position} onValueChange={(v) => setPosition(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="editStartDate">Term start date</Label>
            <DatePicker id="editStartDate" value={startDate} onChange={setStartDate} placeholder="Select start date" />
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
          )}
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="edit-official-form" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteOfficialDialog({
  official,
  open,
  onOpenChange,
}: {
  official: Official;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteOfficial(official.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officials"] });
      onOpenChange(false);
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not delete official."
        : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) mutation.reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete official?</DialogTitle>
          <DialogDescription>
            This permanently removes <span className="font-medium text-foreground">{official.fullName}</span>{" "}
            and their term history. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
        )}

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
