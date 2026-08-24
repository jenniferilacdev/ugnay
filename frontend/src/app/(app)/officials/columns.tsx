"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";

import type { Official } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { OfficialRowActions } from "@/components/official-row-actions";

const inSelected: FilterFn<Official> = (row, id, value) =>
  (value as string[]).includes(row.getValue(id));

export const officialColumns: ColumnDef<Official>[] = [
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
    accessorKey: "fullName",
    meta: { label: "Name" },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("fullName")}</span>
    ),
  },
  {
    id: "position",
    accessorFn: (o) => o.terms[0]?.position ?? "—",
    meta: { label: "Position" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Position" />
    ),
    cell: ({ row }) => <span className="text-sm">{row.getValue("position")}</span>,
    filterFn: inSelected,
  },
  {
    id: "barangay",
    accessorFn: (o) => o.terms[0]?.organizationName ?? "—",
    meta: { label: "Barangay" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
    cell: ({ row }) => <span className="text-sm">{row.getValue("barangay")}</span>,
    filterFn: inSelected,
  },
  {
    id: "termStart",
    accessorFn: (o) => o.terms[0]?.startDate ?? "",
    meta: { label: "Term start" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Term start" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {(row.getValue("termStart") as string) || "—"}
      </span>
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
    cell: ({ row }) => <OfficialRowActions official={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

