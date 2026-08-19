"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { ApiError, createRequest, getOrganizations, getResidents } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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

const CATEGORIES = [
  "Certificate", "Program", "Assistance", "Asset", "Facility",
  "ProfileCorrection", "Concern", "Other",
];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

export function NewRequestDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [category, setCategory] = useState("Certificate");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [residentId, setResidentId] = useState("");

  const barangays = useQuery({
    queryKey: ["organizations", "flat", "Barangay"],
    queryFn: ({ signal }) => getOrganizations("Barangay", signal),
  });
  const residents = useQuery({ queryKey: ["residents"], queryFn: ({ signal }) => getResidents(signal) });

  const mutation = useMutation({
    mutationFn: () =>
      createRequest({
        organizationId,
        category,
        title,
        description: description || null,
        priority,
        requestedByResidentId: residentId || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setResidentId("");
      setOrganizationId("");
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not create request."
        : null;

  const canSubmit = organizationId && title.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            New request
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New request</DialogTitle>
          <DialogDescription>
            Files a request into the shared approval workflow (spec §31).
          </DialogDescription>
        </DialogHeader>

        <form
          id="new-request-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "Other")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? "Normal")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Barangay</Label>
            <Select value={organizationId} onValueChange={(v) => setOrganizationId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select barangay">
                  {(value) => (value ? (barangays.data?.find((b) => b.id === value)?.name ?? "") : "Select barangay")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {barangays.data?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Resident (optional)</Label>
            <Select value={residentId} onValueChange={(v) => setResidentId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select resident">
                  {(value) => (value ? (residents.data?.find((r) => r.id === value)?.fullName ?? "") : "Select resident")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {residents.data?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.fullName} · {r.referenceNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="new-request-form" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
