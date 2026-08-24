"use client";

import type { Column } from "@tanstack/react-table";
import { CheckIcon, PlusCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FacetOption = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: {
  column?: Column<TData, TValue>;
  title: string;
  options: FacetOption[];
}) {
  const facets = column?.getFacetedUniqueValues();
  const selected = new Set((column?.getFilterValue() as string[]) ?? []);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    const arr = Array.from(next);
    column?.setFilterValue(arr.length ? arr : undefined);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="border-dashed">
            <PlusCircleIcon />
            {title}
            {selected.size > 0 && (
              <>
                <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
                <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                  {selected.size}
                </Badge>
                <div className="hidden gap-1 lg:flex">
                  {selected.size > 2 ? (
                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                      {selected.size} selected
                    </Badge>
                  ) : (
                    options
                      .filter((o) => selected.has(o.value))
                      .map((o) => (
                        <Badge
                          key={o.value}
                          variant="secondary"
                          className="rounded-sm px-1 font-normal"
                        >
                          {o.label}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-52 p-1" align="start">
        <div className="max-h-72 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selected.has(option.value);
            const count = facets?.get(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-[4px] border border-primary/60",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-60 [&_svg]:invisible",
                  )}
                >
                  <CheckIcon className="size-3.5" />
                </span>
                {option.icon && (
                  <option.icon className="size-4 text-muted-foreground" />
                )}
                <span className="flex-1 text-left">{option.label}</span>
                {count !== undefined && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selected.size > 0 && (
          <>
            <Separator className="my-1" />
            <button
              type="button"
              onClick={() => column?.setFilterValue(undefined)}
              className="w-full rounded-md px-2 py-1.5 text-center text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
            >
              Clear filters
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
