"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { ApiError, submitRegistration } from "@/lib/api";
import { PublicPortalShell } from "@/components/public-portal-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { lguSlug, barangaySlug } = useParams<{ lguSlug: string; barangaySlug: string }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitRegistration(lguSlug, barangaySlug, {
        firstName,
        lastName,
        birthDate: birthDate || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        address: address || null,
      }),
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not submit registration."
        : null;

  return (
    <PublicPortalShell>
      <div className="mx-auto max-w-lg">
        <nav className="text-sm text-muted-foreground">
          <Link href={`/${lguSlug}/${barangaySlug}`} className="hover:text-primary">
            ← Back to barangay
          </Link>
        </nav>

        {mutation.isSuccess ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Registration submitted</CardTitle>
              <CardDescription>
                Your reference number is{" "}
                <span className="font-mono font-medium text-foreground">
                  {mutation.data.referenceNumber}
                </span>
                . Barangay staff will review your registration. Submitting does not
                by itself confirm residency.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resident registration</CardTitle>
              <CardDescription>
                Register with your barangay. Staff will verify your details before
                you become a verified resident.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (firstName.trim() && lastName.trim()) mutation.mutate();
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
                  <Label htmlFor="birthDate">Birth date</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                {errorMessage && (
                  <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
                )}

                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Submitting…" : "Submit registration"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicPortalShell>
  );
}
