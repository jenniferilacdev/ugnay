"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { ApiError, createResident, getOrganizations } from "@/lib/api";
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

const SEXES = ["Male", "Female", "Unspecified"];
const CIVIL_STATUSES = ["Single", "Married", "Widowed", "Separated", "Divorced", "Other"];

export function NewResidentDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("Male");
  const [civilStatus, setCivilStatus] = useState("Single");
  const [birthDate, setBirthDate] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  const barangays = useQuery({
    queryKey: ["organizations", "flat", "Barangay"],
    queryFn: ({ signal }) => getOrganizations("Barangay", signal),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createResident({
        firstName,
        middleName: middleName || null,
        lastName,
        sex,
        civilStatus,
        birthDate: birthDate || null,
        organizationId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["residents"] });
      setOpen(false);
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setBirthDate("");
      setOrganizationId("");
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not create resident."
        : null;

  const canSubmit = firstName.trim() && lastName.trim() && organizationId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            New resident
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New resident</DialogTitle>
          <DialogDescription>
            New residents start as Pending and require verification (spec §13).
          </DialogDescription>
        </DialogHeader>

        <form
          id="new-resident-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="middleName">Middle name</Label>
            <Input id="middleName" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v ?? "Male")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEXES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Civil status</Label>
              <Select value={civilStatus} onValueChange={(v) => setCivilStatus(v ?? "Single")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIVIL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birthDate">Birth date</Label>
            <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Barangay</Label>
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
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
          )}
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="new-resident-form" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
