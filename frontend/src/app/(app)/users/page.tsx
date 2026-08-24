"use client";

import { useQuery } from "@tanstack/react-query";

import { getUsers } from "@/lib/api";
import { useActingScope } from "@/lib/scope-context";
import { NewUserDialog } from "@/components/new-user-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersPage() {
  const { actingOrgId } = useActingScope();
  const query = useQuery({
    queryKey: ["users", actingOrgId],
    queryFn: ({ signal }) => getUsers(actingOrgId, signal),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Accounts and their barangay scope (spec §11). Add an account to let a
            barangay sign in.
          </p>
        </div>
        <NewUserDialog />
      </div>

      {query.isError && (
        <p className="text-sm text-destructive">Could not load users.</p>
      )}

      {query.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users in this scope yet. Add the first one.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                  <TableCell>
                    {u.barangays && u.barangays.length > 0 ? u.barangays.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles && u.roles.length > 0
                        ? u.roles.map((r) => (
                            <Badge key={r} variant="secondary">{r}</Badge>
                          ))
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "Active" ? "default" : "outline"}>
                      {u.status ?? "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
