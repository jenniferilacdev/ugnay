"use client";

import Link from "next/link";
import type { ColumnDef, FilterFn } from "@tanstack/react-table";

import type { ResidentSummary } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { VerificationBadge } from "@/components/verification-badge";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { ResidentRowActions } from "@/components/resident-row-actions";

/** Filter where the cell value must be one of the selected facet values. */
const inSelected: FilterFn<ResidentSummary> = (row, id, value) =>
  (value as string[]).includes(row.getValue(id));

export const residentColumns: ColumnDef<ResidentSummary>[] = [
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
        href={`/residents/${row.original.id}`}
        className="font-mono text-xs hover:text-primary hover:underline"
      >
        {row.getValue("referenceNumber")}
      </Link>
    ),
  },
  {
    accessorKey: "fullName",
    meta: { label: "Name" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link
        href={`/residents/${row.original.id}`}
        className="font-medium hover:text-primary hover:underline"
      >
        {row.getValue("fullName")}
      </Link>
    ),
  },
  {
    accessorKey: "sex",
    meta: { label: "Sex" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sex" />,
    cell: ({ row }) => <span className="text-sm">{row.getValue("sex")}</span>,
    filterFn: inSelected,
  },
  {
    accessorKey: "currentBarangay",
    meta: { label: "Barangay" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("currentBarangay") ?? "—"}</span>
    ),
    filterFn: inSelected,
  },
  {
    accessorKey: "verificationStatus",
    meta: { label: "Verification" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verification" />
    ),
    cell: ({ row }) => (
      <VerificationBadge status={row.getValue("verificationStatus")} />
    ),
    filterFn: inSelected,
  },
  {
    accessorKey: "status",
    meta: { label: "Status" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("status")}</Badge>
    ),
    filterFn: inSelected,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ResidentRowActions resident={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

