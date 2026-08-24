"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: cn(defaults.root, "w-fit"),
        months: cn(defaults.months, "relative flex flex-col gap-4 sm:flex-row"),
        month: cn(defaults.month, "flex w-full flex-col gap-4"),
        month_caption: cn(
          defaults.month_caption,
          "relative flex h-8 items-center justify-center px-8",
        ),
        caption_label: cn(
          defaults.caption_label,
          "inline-flex items-center gap-1 text-sm font-medium [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
        ),
        dropdowns: cn(defaults.dropdowns, "flex items-center gap-2"),
        dropdown_root: cn(
          defaults.dropdown_root,
          "relative inline-flex items-center rounded-md border border-input px-2 py-1 text-sm font-medium shadow-xs transition-colors hover:bg-accent has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50",
        ),
        dropdown: cn(
          defaults.dropdown,
          "absolute inset-0 cursor-pointer opacity-0",
        ),
        nav: cn(defaults.nav, "absolute inset-x-0 top-0 flex items-center justify-between"),
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "size-7 bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "size-7 bg-transparent p-0 opacity-70 hover:opacity-100",
        ),
        month_grid: cn(defaults.month_grid, "w-full border-collapse space-x-1"),
        weekdays: cn(defaults.weekdays, "flex"),
        weekday: cn(
          defaults.weekday,
          "w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        ),
        week: cn(defaults.week, "mt-2 flex w-full"),
        day: cn(
          defaults.day,
          "relative size-8 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md [&:has([aria-selected])]:bg-accent",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        today: cn(defaults.today, "rounded-md bg-accent text-accent-foreground"),
        selected: cn(
          defaults.selected,
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground",
        ),
        outside: cn(defaults.outside, "text-muted-foreground opacity-50"),
        disabled: cn(defaults.disabled, "text-muted-foreground opacity-50"),
        hidden: cn(defaults.hidden, "invisible"),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : orientation === "up"
                  ? ChevronUpIcon
                  : ChevronDownIcon;
          return <Icon className={cn("size-4", chevronClassName)} />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
