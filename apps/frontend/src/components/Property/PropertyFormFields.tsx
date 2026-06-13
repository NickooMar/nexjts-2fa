"use client";

import {
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import flags from "react-phone-number-input/flags";
import type { Country } from "react-phone-number-input";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LocationCombobox,
  ComboboxOption,
} from "@/components/ui/location-combobox";
import { PropertyFormState } from "@/schemas/property.schema";
import { PROPERTY_TYPES } from "@/types/property/property.types";
import {
  useCities,
  useStates,
  useCountries,
} from "@/hooks/queries/use-locations";

interface PropertyFormFieldsProps {
  form: UseFormReturn<PropertyFormState>;
  showUnits?: boolean;
}

/** Country flag shown beside each option, matching the phone input's UX. */
function countryFlag(option: ComboboxOption) {
  const Flag = flags[option.id as Country];
  return (
    <span className="flex h-4 w-6 shrink-0 overflow-hidden rounded-sm bg-foreground/20 [&_svg]:size-full">
      {Flag && <Flag title={option.name} />}
    </span>
  );
}

/**
 * Shared field set for the create and edit property dialogs so both flows
 * stay in sync as the model grows.
 */
export function PropertyFormFields({
  form,
  showUnits = true,
}: PropertyFormFieldsProps) {
  const t = useTranslations("properties");

  // Dependent location selectors: country → state → city. Each level loads
  // only once its parent is chosen, and changing a parent resets and refetches
  // its descendants (see the field onChange handlers below).
  const country = form.watch("country");
  const stateCode = form.watch("stateCode");
  const countries = useCountries();
  const states = useStates(country || undefined);
  const cities = useCities(country || undefined, stateCode || undefined);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("form.name.title")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="text"
                autoFocus
                placeholder={t("form.name.placeholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("form.type.title")}</FormLabel>
            <FormControl>
              <div
                role="radiogroup"
                aria-label={t("form.type.title")}
                className="grid grid-cols-2 gap-2 sm:grid-cols-5"
              >
                {PROPERTY_TYPES.map((type) => {
                  const isSelected = field.value === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => field.onChange(type)}
                      className={cn(
                        buttonVariants({
                          variant: isSelected ? "default" : "outline",
                          size: "sm",
                        }),
                        "h-10 w-full rounded-full px-3 text-sm capitalize"
                      )}
                    >
                      {t(`types.${type}`)}
                    </button>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showUnits && (
        <FormField
          control={form.control}
          name="units"
          render={({ field }) => (
            <FormItem className="sm:max-w-[50%]">
              <FormLabel>{t("form.units.title")}</FormLabel>
              <FormControl>
                <Input {...field} type="number" min={0} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.country.title")}</FormLabel>
              <FormControl>
                <LocationCombobox
                  value={field.value || undefined}
                  options={countries.data ?? []}
                  loading={countries.isLoading}
                  getOptionIcon={countryFlag}
                  placeholder={t("form.country.placeholder")}
                  searchPlaceholder={t("form.location.search")}
                  emptyText={t("form.location.no_countries")}
                  onChange={(option) => {
                    field.onChange(option.id);
                    // A new country invalidates any chosen state/city.
                    form.setValue("stateCode", "", { shouldDirty: true });
                    form.setValue("state", "", { shouldDirty: true });
                    form.setValue("city", "", { shouldDirty: true });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stateCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.state.title")}</FormLabel>
              <FormControl>
                <LocationCombobox
                  value={field.value || undefined}
                  options={states.data ?? []}
                  loading={!!country && states.isLoading}
                  disabled={!country}
                  placeholder={
                    country
                      ? t("form.state.placeholder")
                      : t("form.state.disabled")
                  }
                  searchPlaceholder={t("form.location.search")}
                  emptyText={t("form.location.no_states")}
                  onChange={(option) => {
                    // Persist both the ISO code (identifier) and the display
                    // name; reset the city since it belongs to the old state.
                    field.onChange(option.id);
                    form.setValue("state", option.name, { shouldDirty: true });
                    form.setValue("city", "", { shouldDirty: true });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.city.title")}</FormLabel>
              <FormControl>
                <LocationCombobox
                  value={field.value || undefined}
                  options={cities.data ?? []}
                  loading={!!stateCode && cities.isLoading}
                  disabled={!stateCode}
                  placeholder={
                    stateCode
                      ? t("form.city.placeholder")
                      : t("form.city.disabled")
                  }
                  searchPlaceholder={t("form.location.search")}
                  emptyText={t("form.location.no_cities")}
                  // Cities have no stable id, so the name is the value.
                  onChange={(option) => field.onChange(option.name)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.address.title")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder={t("form.address.placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.postal_code.title")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder={t("form.postal_code.placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("form.description.title")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                placeholder={t("form.description.placeholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
