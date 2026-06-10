import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import labels from "react-phone-number-input/locale/en.json";

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

type CountrySelectProps = {
  value?: string;
  onChange?: (value: RPNInput.Country | "") => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
};

const COUNTRIES = RPNInput.getCountries()
  .map((country) => ({ value: country, label: labels[country] ?? country }))
  .sort((a, b) => a.label.localeCompare(b.label));

/**
 * Standalone country picker sharing the flags/search UX of the phone input,
 * but storing a plain ISO country code (e.g. "AR") instead of a phone number.
 */
const CountrySelect = React.forwardRef<HTMLButtonElement, CountrySelectProps>(
  (
    {
      value,
      onChange,
      disabled,
      placeholder = "Select country",
      searchPlaceholder = "Search country...",
      emptyText = "No country found.",
      className,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const selected = value as RPNInput.Country | undefined;
    const selectedLabel = selected ? labels[selected] : undefined;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            disabled={disabled}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex w-full justify-between gap-2 font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {selected && (
                <FlagComponent
                  country={selected}
                  countryName={selectedLabel ?? selected}
                />
              )}
              <span className="truncate">{selectedLabel ?? placeholder}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          // Keep the dropdown inside the DOM tree (no portal) so it works when
          // rendered within a modal Dialog: the Dialog's focus trap and scroll
          // lock would otherwise block typing in the search box and scrolling
          // the list of a body-portaled popover.
          portal={false}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <ScrollArea className="h-72">
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {COUNTRIES.map(({ value: country, label }) => (
                    <CommandItem
                      key={country}
                      className="gap-2"
                      onSelect={() => {
                        onChange?.(country);
                        setOpen(false);
                      }}
                    >
                      <FlagComponent country={country} countryName={label} />
                      <span className="flex-1 text-sm">{label}</span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          country === selected ? "opacity-100" : "opacity-0",
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
  },
);
CountrySelect.displayName = "CountrySelect";

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 shrink-0 overflow-hidden rounded-sm bg-foreground/20 [&_svg]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { CountrySelect };
