"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import {
  DataTableFacetedFilter,
  type FacetOption,
} from "@/components/ui/data-table-faceted-filter";

declare module "@tanstack/react-table" {
  // Lets column defs carry a human label for the "View" column toggle.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
  }
}

export type DataTableFacet = {
  columnId: string;
  title: string;
  options: FacetOption[];
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumnId,
  searchPlaceholder = "Filter…",
  facets = [],
  initialPageSize = 10,
  emptyMessage = "No results.",
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumnId?: string;
  searchPlaceholder?: string;
  facets?: DataTableFacet[];
  initialPageSize?: number;
  emptyMessage?: string;
}) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize: initialPageSize } },
  });

  const searchColumn = searchColumnId ? table.getColumn(searchColumnId) : undefined;
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    Boolean(searchColumn?.getFilterValue());

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b bg-background p-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {searchColumn && (
            <Input
              placeholder={searchPlaceholder}
              value={(searchColumn.getFilterValue() as string) ?? ""}
              onChange={(e) => searchColumn.setFilterValue(e.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
          )}
          {facets.map((facet) => {
            const column = table.getColumn(facet.columnId);
            return column ? (
              <DataTableFacetedFilter
                key={facet.columnId}
                column={column}
                title={facet.title}
                options={facet.options}
              />
            ) : null;
          })}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                table.resetColumnFilters();
                searchColumn?.setFilterValue("");
              }}
            >
              Reset
              <XIcon />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="border-t bg-muted/50 px-2 py-2">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
