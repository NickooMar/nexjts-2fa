"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, ContactFormState } from "@/schemas/contact.schema";
import { PropertyContact } from "@/types/property/contact.types";
import { NewContactDraft, nextDraftId } from "../create/wizard.helpers";

const EMPTY_CONTACT: ContactFormState = {
  fullName: "",
  email: "",
  phone: "",
  documentId: "",
  notes: "",
};

interface ContactsSelectorProps {
  /** Translation namespace scoping all roster/form copy (`properties.owners`…). */
  namespace: string;
  /** Existing organization roster to pick from. */
  contacts: PropertyContact[];
  isPending: boolean;
  selectedIds: string[];
  onToggleExisting: (contactId: string) => void;
  newContacts: NewContactDraft[];
  onChangeNewContacts: (drafts: NewContactDraft[]) => void;
  disabled?: boolean;
  /** Icon for the empty-roster state (defaults to Users). */
  emptyIcon?: LucideIcon;
}

/**
 * Shared people picker used by both the Tenants and Owners steps: search the
 * existing roster, multi-select, and queue brand-new contacts for creation.
 * Purely presentational — the parent owns selection/draft state and supplies
 * the roster query result, so the same UI drives two independent rosters.
 */
export function ContactsSelector({
  namespace,
  contacts,
  isPending,
  selectedIds,
  onToggleExisting,
  newContacts,
  onChangeNewContacts,
  disabled,
  emptyIcon: EmptyIcon = Users,
}: ContactsSelectorProps) {
  const tt = useTranslations(namespace);

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const form = useForm<ContactFormState>({
    resolver: zodResolver(contactSchema(tt)),
    defaultValues: EMPTY_CONTACT,
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) =>
      [contact.fullName, contact.email, contact.phone, contact.documentId]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [contacts, search]);

  const addNewContact = form.handleSubmit((values) => {
    onChangeNewContacts([...newContacts, { id: nextDraftId(), values }]);
    form.reset(EMPTY_CONTACT);
    setFormOpen(false);
  });

  return (
    <div className="space-y-6">
      {/* Existing roster */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{tt("existing_title")}</p>
        {isPending ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-8">
            <Spinner />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
            <EmptyIcon className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {tt("existing_empty")}
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                className="pl-9"
                placeholder={tt("search_placeholder")}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <li className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {tt("no_results", { query: search })}
                </li>
              ) : (
                filtered.map((contact) => {
                  const isSelected = selectedIds.includes(contact._id);
                  return (
                    <li key={contact._id}>
                      <button
                        type="button"
                        disabled={disabled}
                        aria-pressed={isSelected}
                        onClick={() => onToggleExisting(contact._id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50",
                          disabled && "cursor-not-allowed opacity-60"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-md border",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {isSelected && <Check className="size-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {contact.fullName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {[contact.email, contact.phone]
                              .filter(Boolean)
                              .join(" · ") || tt("no_contact_info")}
                          </span>
                        </span>
                        {contact.propertyIds.length > 0 && (
                          <Badge variant="secondary" className="shrink-0">
                            {tt("occupies_count", {
                              count: contact.propertyIds.length,
                            })}
                          </Badge>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </>
        )}
      </div>

      {/* New contacts queued for creation */}
      <div className="space-y-3">
        <p className="text-sm font-medium">{tt("new_title")}</p>
        {newContacts.length > 0 && (
          <ul className="space-y-2">
            {newContacts.map((draft) => (
              <li
                key={draft.id}
                className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3"
              >
                <UserPlus className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {draft.values.fullName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[draft.values.email, draft.values.phone]
                      .filter(Boolean)
                      .join(" · ") || tt("no_contact_info")}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {tt("new_badge")}
                </Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={tt("remove")}
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    onChangeNewContacts(
                      newContacts.filter((existing) => existing.id !== draft.id)
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {!formOpen ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="gap-2"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="size-4" />
            {tt("add_action")}
          </Button>
        ) : (
          <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <p className="text-sm font-semibold">{tt("add_title")}</p>
            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tt("form.full_name.title")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={tt("form.full_name.placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tt("form.email.title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder={tt("form.email.placeholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tt("form.phone.title")}</FormLabel>
                        <FormControl>
                          <PhoneInput
                            {...field}
                            defaultCountry="AR"
                            placeholder={tt("form.phone.placeholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="documentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tt("form.document_id.title")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={tt("form.document_id.placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tt("form.notes.title")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={2}
                          placeholder={tt("form.notes.placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => {
                      form.reset(EMPTY_CONTACT);
                      setFormOpen(false);
                    }}
                  >
                    {tt("cancel")}
                  </Button>
                  <Button type="button" disabled={disabled} onClick={addNewContact}>
                    {tt("add_submit")}
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
