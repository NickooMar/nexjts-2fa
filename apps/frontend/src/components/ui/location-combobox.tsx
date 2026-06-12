"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  id: string;
  name: string;
}

interface LocationComboboxProps {
  value?: string;
  onChange: (option: ComboboxOption) => void;
  options: ComboboxOption[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  /**
   * Optional leading icon per option (e.g. a country flag), shown both in the
   * trigger for the selected value and beside each item in the list.
   */
  getOptionIcon?: (option: ComboboxOption) => React.ReactNode;
}

/**
 * Generic searchable single-select used by the dependent Country → State → City
 * selectors. Built on Popover + Command (the same pattern as `country-select`),
 * including `portal={false}` so it works inside a modal Dialog's focus trap.
 *
 * `value` is the selected option id; `onChange` returns the whole option so the
 * caller can persist both the id and the human-readable name.
 */
const LocationCombobox = React.forwardRef<
  HTMLButtonElement,
  LocationComboboxProps
>(
  (
    {
      value,
      onChange,
      options,
      loading,
      disabled,
      placeholder = "Select…",
      searchPlaceholder = "Search…",
      emptyText = "No results.",
      className,
      getOptionIcon,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const selected = React.useMemo(
      () => options.find((o) => o.id === value),
      [options, value]
    );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            disabled={disabled || loading}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex w-full justify-between gap-2 font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {selected && getOptionIcon?.(selected)}
              <span className="truncate">{selected?.name ?? placeholder}</span>
            </span>
            {loading ? (
              <Loader2 className="size-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          // No portal so the dropdown works inside the create/edit Dialog: the
          // Dialog's focus trap and scroll lock would otherwise block the
          // search box and list of a body-portaled popover.
          portal={false}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <ScrollArea className="h-72">
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      className="gap-2"
                      onSelect={() => {
                        onChange(option);
                        setOpen(false);
                      }}
                    >
                      {getOptionIcon?.(option)}
                      <span className="flex-1 text-sm">{option.name}</span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          option.id === value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
LocationCombobox.displayName = "LocationCombobox";

export { LocationCombobox };
