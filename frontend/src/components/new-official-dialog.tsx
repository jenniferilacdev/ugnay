"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { ApiError, createOfficial, getOrganizations } from "@/lib/api";
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

const POSITIONS = [
  "Barangay Captain",
  "Barangay Secretary",
  "Barangay Treasurer",
  "Kagawad",
  "SK Chairperson",
];

export function NewOfficialDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [startDate, setStartDate] = useState("");

  const barangays = useQuery({
    queryKey: ["organizations", "flat", "Barangay"],
    queryFn: ({ signal }) => getOrganizations("Barangay", signal),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createOfficial({
        fullName,
        position,
        organizationId,
        startDate: startDate || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["officials"] });
      setOpen(false);
      setFullName("");
      setPosition("");
      setOrganizationId("");
      setStartDate("");
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not create official."
        : null;

  const canSubmit = fullName.trim() && position && organizationId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            New official
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New official</DialogTitle>
          <DialogDescription>
            Record an official and their current term (spec §36).
          </DialogDescription>
        </DialogHeader>

        <form
          id="new-official-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Barangay</Label>
            <Select
              value={organizationId}
              onValueChange={(v) => setOrganizationId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select barangay">
                  {(value) =>
                    value
                      ? (barangays.data?.find((b) => b.id === value)?.name ?? "")
                      : "Select barangay"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {barangays.data?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Position</Label>
            <Select value={position} onValueChange={(v) => setPosition(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="startDate">Term start date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            type="submit"
            form="new-official-form"
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
