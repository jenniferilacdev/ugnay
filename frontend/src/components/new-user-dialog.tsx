"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlusIcon } from "lucide-react";

import { ApiError, createUser, getUserRoles } from "@/lib/api";
import { useScopedBarangays } from "@/lib/use-barangays";
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

export function NewUserDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [roleKey, setRoleKey] = useState("barangay-admin");

  const { barangays } = useScopedBarangays();
  const roles = useQuery({
    queryKey: ["user-roles"],
    queryFn: ({ signal }) => getUserRoles(signal),
  });

  // A barangay-level account only has its own barangay — use it implicitly and
  // hide the picker.
  const isBarangayScoped = barangays.length === 1;
  const effectiveOrgId =
    organizationId || (isBarangayScoped ? barangays[0].id : "");

  const reset = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setOrganizationId("");
    setRoleKey("barangay-admin");
  };

  const mutation = useMutation({
    mutationFn: () =>
      createUser({ email, fullName, password, organizationId: effectiveOrgId, roleKey }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      reset();
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not create user."
        : null;

  const canSubmit =
    fullName.trim() && email.trim() && password.trim() && effectiveOrgId && roleKey;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) mutation.reset(); }}>
      <DialogTrigger
        render={
          <Button size="sm">
            <UserPlusIcon />
            Add user
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a barangay-scoped account. The user can sign in immediately with
            the email and password you set.
          </DialogDescription>
        </DialogHeader>

        <form
          id="new-user-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) mutation.mutate();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" placeholder="e.g. Juan Dela Cruz" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@barangay.gov.ph" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Needs upper &amp; lower case, a number, and a symbol.
            </p>
          </div>

          <div className={isBarangayScoped ? "flex flex-col gap-2" : "grid grid-cols-2 gap-3"}>
            {!isBarangayScoped && (
              <div className="flex flex-col gap-2">
                <Label>Barangay</Label>
                <Select value={organizationId} onValueChange={(v) => setOrganizationId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select barangay">
                      {(value) =>
                        value ? (barangays.find((b) => b.id === value)?.name ?? "") : "Select barangay"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {barangays.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={roleKey} onValueChange={(v) => setRoleKey(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role">
                    {(value) =>
                      value ? (roles.data?.find((r) => r.key === value)?.name ?? value) : "Select role"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.data?.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
          )}
        </form>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button type="submit" form="new-user-form" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
