"use client";

import Link from "next/link";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";

import type { HouseholdSummary } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { HouseholdRowActions } from "@/components/household-row-actions";

const inSelected: FilterFn<HouseholdSummary> = (row, id, value) =>
  (value as string[]).includes(row.getValue(id));

export const householdColumns: ColumnDef<HouseholdSummary>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={
          table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "referenceNumber",
    meta: { label: "Reference" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/households/${row.original.id}`}
        className="font-mono text-xs hover:text-primary hover:underline"
      >
        {row.getValue("referenceNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "barangay",
    meta: { label: "Barangay" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
    cell: ({ row }) => <span className="text-sm">{row.getValue("barangay")}</span>,
    filterFn: inSelected,
  },
  {
    accessorKey: "houseNumber",
    meta: { label: "House no." },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="House no." />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("houseNumber") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "street",
    meta: { label: "Street" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Street" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("street") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "zone",
    meta: { label: "Zone" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Zone" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("zone") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "headName",
    meta: { label: "Head" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Head" />,
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("headName") ?? "—"}</span>
    ),
  },
  {
    accessorKey: "memberCount",
    meta: { label: "Members" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Members" />
    ),
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.getValue("memberCount")}</span>
    ),
  },
  {
    accessorKey: "status",
    meta: { label: "Status" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <Badge variant="outline">{row.getValue("status")}</Badge>,
    filterFn: inSelected,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <HouseholdRowActions household={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

