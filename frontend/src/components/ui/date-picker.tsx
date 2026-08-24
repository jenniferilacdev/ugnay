"use client";

import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const WIRE_FORMAT = "yyyy-MM-dd";

/**
 * A shadcn-style date picker. Reads/writes an ISO `yyyy-MM-dd` string so it drops
 * in wherever a native `<input type="date">` was used.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  id,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  const selected = value ? parse(value, WIRE_FORMAT, new Date()) : undefined;
  const isValid = selected && !Number.isNaN(selected.getTime());

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !isValid && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="text-muted-foreground" />
            {isValid ? format(selected, "PPP") : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={isValid ? selected : undefined}
          defaultMonth={isValid ? selected : undefined}
          captionLayout="dropdown"
          startMonth={new Date(1920, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          onSelect={(date) => onChange(date ? format(date, WIRE_FORMAT) : "")}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
