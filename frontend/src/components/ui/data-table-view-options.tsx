"use client";

import type { Table } from "@tanstack/react-table";
import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DataTableViewOptions<TData>({ table }: { table: Table<TData> }) {
  const columns = table
    .getAllColumns()
    .filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="ml-auto hidden lg:flex">
            <Settings2Icon />
            View
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {(column.columnDef.meta as { label?: string } | undefined)?.label ??
              column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
