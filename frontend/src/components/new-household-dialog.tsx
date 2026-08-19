"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { ApiError, createHousehold, getOrganizations, getResidents } from "@/lib/api";
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

export function NewHouseholdDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [address, setAddress] = useState("");
  const [housingType, setHousingType] = useState("");
  const [headResidentId, setHeadResidentId] = useState("");

  const barangays = useQuery({
    queryKey: ["organizations", "flat", "Barangay"],
    queryFn: ({ signal }) => getOrganizations("Barangay", signal),
  });
  const residents = useQuery({
    queryKey: ["residents"],
    queryFn: ({ signal }) => getResidents(signal),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createHousehold({
        organizationId,
        address: address || null,
        housingType: housingType || null,
        headResidentId: headResidentId || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["households"] });
      setOpen(false);
      setOrganizationId("");
      setAddress("");
      setHousingType("");
      setHeadResidentId("");
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not create household."
        : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            New household
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New household</DialogTitle>
          <DialogDescription>
            Register a household and optionally designate its head (spec §33).
          </DialogDescription>
        </DialogHeader>

        <form
          id="new-household-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (organizationId) mutation.mutate();
          }}
        >
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="housingType">Housing type</Label>
            <Input id="housingType" placeholder="e.g. Concrete" value={housingType} onChange={(e) => setHousingType(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Household head (optional)</Label>
            <Select value={headResidentId} onValueChange={(v) => setHeadResidentId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select resident">
                  {(value) =>
                    value ? (residents.data?.find((r) => r.id === value)?.fullName ?? "") : "Select resident"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {residents.data?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.fullName} · {r.referenceNumber}
                  </SelectItem>
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
          <Button type="submit" form="new-household-form" disabled={!organizationId || mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
