"use client";

import {
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
  Form,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileSignature, ImageIcon, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { contractSchema, ContractFormState } from "@/schemas/contract.schema";
import {
  CONTRACT_TYPES,
  CONTRACT_STATUSES,
  CONTRACT_CURRENCIES,
  PAYMENT_FREQUENCIES,
} from "@/types/property/contract.types";
import { MediaDropzone } from "@/components/Property/media/MediaDropzone";
import {
  IMAGE_MAX_PER_PROPERTY,
  DOCUMENT_MAX_PER_REQUEST,
} from "@/components/Property/media/media.helpers";
import { WizardImagePicker } from "./WizardImagePicker";
import { WizardFileList } from "./WizardFileList";
import {
  ImageDraft,
  FileDraft,
  ContractDraft,
  nextDraftId,
  toImageDrafts,
  toFileDrafts,
  revokeImageDrafts,
} from "./wizard.helpers";

/** Matches the native-select styling used by PropertyFormFields. */
const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const EMPTY_CONTRACT: ContractFormState = {
  title: "",
  type: "rental",
  status: "active",
  startDate: "",
  endDate: "",
  amount: "",
  currency: "",
  paymentFrequency: "",
  deposit: "",
  notes: "",
};

interface StepContractsProps {
  contracts: ContractDraft[];
  disabled?: boolean;
  onChange: (contracts: ContractDraft[]) => void;
}

/**
 * Step 2 (optional): contracts tied to the property — lease/sale details
 * plus scanned images and documents. Multiple contracts can be queued; all
 * of them are created right after the property on final submit.
 */
export function StepContracts({
  contracts,
  disabled,
  onChange,
}: StepContractsProps) {
  const t = useTranslations("properties.new");
  const tc = useTranslations("properties.contracts");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [documents, setDocuments] = useState<FileDraft[]>([]);

  const form = useForm<ContractFormState>({
    resolver: zodResolver(contractSchema(tc)),
    defaultValues: EMPTY_CONTRACT,
  });

  const resetForm = () => {
    form.reset(EMPTY_CONTRACT);
    setImages([]);
    setDocuments([]);
    setEditingId(null);
    setFormOpen(false);
  };

  const saveDraft = form.handleSubmit((values) => {
    const draft: ContractDraft = {
      id: editingId ?? nextDraftId(),
      values,
      images,
      documents,
    };
    onChange(
      editingId
        ? contracts.map((existing) =>
            existing.id === editingId ? draft : existing
          )
        : [...contracts, draft]
    );
    resetForm();
  });

  const editDraft = (draft: ContractDraft) => {
    form.reset(draft.values);
    setImages(draft.images);
    setDocuments(draft.documents);
    setEditingId(draft.id);
    setFormOpen(true);
  };

  const removeDraft = (draft: ContractDraft) => {
    revokeImageDrafts(draft.images);
    onChange(contracts.filter((existing) => existing.id !== draft.id));
    if (editingId === draft.id) resetForm();
  };

  const formatRange = (values: ContractFormState) => {
    if (!values.startDate && !values.endDate) return null;
    return [values.startDate || "…", values.endDate || "…"].join(" → ");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("steps.contracts.title")}</CardTitle>
          <CardDescription>{t("steps.contracts.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contracts.length === 0 && !formOpen && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
              <FileSignature className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {tc("empty_description")}
              </p>
            </div>
          )}

          {contracts.length > 0 && (
            <ul className="space-y-3">
              {contracts.map((draft) => (
                <li
                  key={draft.id}
                  className="flex items-start justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate font-medium">{draft.values.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {tc(`types.${draft.values.type}`)}
                      </Badge>
                      <Badge variant="outline">
                        {tc(`statuses.${draft.values.status}`)}
                      </Badge>
                      {draft.values.amount !== "" &&
                        draft.values.amount !== undefined && (
                          <span>
                            {draft.values.currency || ""}{" "}
                            {draft.values.amount}
                            {draft.values.paymentFrequency
                              ? ` · ${tc(`frequencies.${draft.values.paymentFrequency}`)}`
                              : ""}
                          </span>
                        )}
                      {formatRange(draft.values) && (
                        <span>{formatRange(draft.values)}</span>
                      )}
                      {draft.images.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="size-3" />
                          {draft.images.length}
                        </span>
                      )}
                      {draft.documents.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip className="size-3" />
                          {draft.documents.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={disabled}
                      aria-label={tc("edit")}
                      className="size-8"
                      onClick={() => editDraft(draft)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={disabled}
                      aria-label={tc("remove")}
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeDraft(draft)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
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
              {tc("add_action")}
            </Button>
          ) : (
            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-semibold">
                {editingId ? tc("edit_title") : tc("add_title")}
              </p>
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tc("form.title.title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={tc("form.title.placeholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("form.type.title")}</FormLabel>
                          <FormControl>
                            <select {...field} className={SELECT_CLASS}>
                              {CONTRACT_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {tc(`types.${type}`)}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("form.status.title")}</FormLabel>
                          <FormControl>
                            <select {...field} className={SELECT_CLASS}>
                              {CONTRACT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {tc(`statuses.${status}`)}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("form.start_date.title")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("form.end_date.title")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("form.amount.title")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("form.currency.title")}</FormLabel>
                          <FormControl>
                            <select {...field} className={SELECT_CLASS}>
                              <option value="">
                                {tc("form.currency.placeholder")}
                              </option>
                              {CONTRACT_CURRENCIES.map((currency) => (
                                <option key={currency} value={currency}>
                                  {currency}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tc("form.frequency.title")}</FormLabel>
                          <FormControl>
                            <select {...field} className={SELECT_CLASS}>
                              <option value="">
                                {tc("form.frequency.placeholder")}
                              </option>
                              {PAYMENT_FREQUENCIES.map((frequency) => (
                                <option key={frequency} value={frequency}>
                                  {tc(`frequencies.${frequency}`)}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="deposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tc("form.deposit.title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
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
                        <FormLabel>{tc("form.notes.title")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder={tc("form.notes.placeholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">{tc("files.images")}</p>
                    <WizardImagePicker
                      images={images}
                      coverId={null}
                      withCover={false}
                      maxImages={IMAGE_MAX_PER_PROPERTY}
                      disabled={disabled}
                      onAdd={(files) =>
                        setImages((current) => [
                          ...current,
                          ...toImageDrafts(files),
                        ])
                      }
                      onRemove={(id) => {
                        const removed = images.find(
                          (draft) => draft.id === id
                        );
                        if (removed) revokeImageDrafts([removed]);
                        setImages((current) =>
                          current.filter((draft) => draft.id !== id)
                        );
                      }}
                      onSetCover={() => undefined}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      {tc("files.documents")}
                    </p>
                    <MediaDropzone
                      kind="document"
                      compact
                      remainingSlots={DOCUMENT_MAX_PER_REQUEST - documents.length}
                      disabled={disabled}
                      onFiles={(files) =>
                        setDocuments((current) => [
                          ...current,
                          ...toFileDrafts(files),
                        ])
                      }
                    />
                    <WizardFileList
                      files={documents}
                      disabled={disabled}
                      onRemove={(id) =>
                        setDocuments((current) =>
                          current.filter((draft) => draft.id !== id)
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={disabled}
                      onClick={resetForm}
                    >
                      {tc("cancel")}
                    </Button>
                    <Button type="button" disabled={disabled} onClick={saveDraft}>
                      {editingId ? tc("save_changes") : tc("add_submit")}
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
