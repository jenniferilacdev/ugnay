"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { ApiError, getBarangayPortal } from "@/lib/api";
import { PublicPortalShell } from "@/components/public-portal-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BarangayPortalPage() {
  const { lguSlug, barangaySlug } = useParams<{
    lguSlug: string;
    barangaySlug: string;
  }>();

  const query = useQuery({
    queryKey: ["portal", "barangay", lguSlug, barangaySlug],
    queryFn: ({ signal }) => getBarangayPortal(lguSlug, barangaySlug, signal),
    retry: false,
  });

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <PublicPortalShell>
        <h1 className="text-xl font-semibold">
          {notFound ? "Portal not found" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {notFound
            ? `No barangay portal exists at "/${lguSlug}/${barangaySlug}".`
            : "Please try again later."}
        </p>
      </PublicPortalShell>
    );
  }

  const data = query.data;

  return (
    <PublicPortalShell>
      <div className="flex flex-col gap-8">
        <div>
          <nav className="text-sm text-muted-foreground">
            <Link href={`/${lguSlug}`} className="hover:text-primary">
              {data?.lgu.name ?? lguSlug}
            </Link>
            <span className="px-1.5">/</span>
            <span>{data?.barangay.name ?? barangaySlug}</span>
          </nav>
          <p className="mt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Barangay
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {data?.barangay.name ?? "Loading…"}
          </h1>
          {data && (
            <p className="mt-1 text-muted-foreground">
              {data.purokCount} purok{data.purokCount === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resident services</CardTitle>
            <CardDescription>
              Sign in to request certificates, apply to programs, and track
              requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button render={<Link href="/login" />} nativeButton={false}>
              Resident sign in
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/${lguSlug}/${barangaySlug}/register`} />}
            >
              Register
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicPortalShell>
  );
}
