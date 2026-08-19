"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";

import { ApiError, getLguPortal } from "@/lib/api";
import { PublicPortalShell } from "@/components/public-portal-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LguPortalPage() {
  const { lguSlug } = useParams<{ lguSlug: string }>();
  const query = useQuery({
    queryKey: ["portal", "lgu", lguSlug],
    queryFn: ({ signal }) => getLguPortal(lguSlug, signal),
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
            ? `No LGU portal exists at "/${lguSlug}".`
            : "Please try again later."}
        </p>
      </PublicPortalShell>
    );
  }

  const data = query.data;
  const settings = data?.lgu.settings;

  return (
    <PublicPortalShell>
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {data?.lgu.type ?? ""}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {settings?.portalName ?? data?.lgu.name ?? "Loading…"}
          </h1>
          {(settings?.province || settings?.region) && (
            <p className="mt-1 text-muted-foreground">
              {[settings?.province, settings?.region].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Barangays</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isPending && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            <ul className="divide-y">
              {data?.barangays.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/${lguSlug}/${b.slug}`}
                    className="flex items-center justify-between py-3 text-sm hover:text-primary"
                  >
                    <span className="font-medium">{b.name}</span>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
            {data?.barangays.length === 0 && (
              <p className="text-sm text-muted-foreground">No barangays published.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicPortalShell>
  );
}
