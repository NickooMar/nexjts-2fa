"use client";

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { KeyRound, Loader, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { useOwners, usePropertyOwners } from "@/hooks/queries/use-owners";
import {
  useAttachOwners,
  useDetachOwner,
  useCreatePropertyOwner,
} from "@/hooks/mutations/use-owner-mutations";
import { ContactsSelector } from "./ContactsSelector";
import { NewContactDraft, toContactInput } from "../create/wizard.helpers";

/** Two-letter initials for the avatar fallback. */
function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PropertyOwnersSectionProps {
  propertyIdOrSlug: string;
  canManage: boolean;
}

/**
 * Owners attached to a property, shown on the detail page. Doubles as the
 * edit surface: managers can attach existing owners, create brand-new ones,
 * and detach owners (their roster record survives). Reuses the shared
 * {@link ContactsSelector} inside the manage dialog.
 */
export function PropertyOwnersSection({
  propertyIdOrSlug,
  canManage,
}: PropertyOwnersSectionProps) {
  const t = useTranslations("properties.details.owners");
  const tm = useTranslations("properties.owners");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newOwners, setNewOwners] = useState<NewContactDraft[]>([]);

  const { data: owners = [], isPending } = usePropertyOwners(propertyIdOrSlug);
  const { data: roster = [], isPending: rosterPending } = useOwners({
    enabled: dialogOpen,
  });

  const attachOwners = useAttachOwners({
    errorMessage: tm("messages.errors.attach_failed"),
    errorMessages: {
      insufficient_permissions: tm(
        "messages.errors.insufficient_permissions"
      ),
    },
  });
  const createOwner = useCreatePropertyOwner({
    errorMessage: tm("messages.errors.create_failed"),
    errorMessages: {
      insufficient_permissions: tm(
        "messages.errors.insufficient_permissions"
      ),
    },
  });
  const detachOwner = useDetachOwner({
    successMessage: tm("messages.success.detached"),
    errorMessage: tm("messages.errors.detach_failed"),
  });

  const isSaving = attachOwners.isPending || createOwner.isPending;

  const resetDialog = () => {
    setSelectedIds([]);
    setNewOwners([]);
  };

  const onSave = async () => {
    // Attach selected existing owners first, then create the brand-new ones —
    // all already linked to this property.
    if (selectedIds.length > 0) {
      await attachOwners
        .mutateAsync({ propertyIdOrSlug, ownerIds: selectedIds })
        .catch(() => undefined);
    }
    for (const draft of newOwners) {
      await createOwner
        .mutateAsync({
          input: toContactInput(draft.values),
          propertyId: propertyIdOrSlug,
          propertyIdOrSlug,
        })
        .catch(() => undefined);
    }
    setDialogOpen(false);
    resetDialog();
  };

  // Owners already on the property can't be re-attached from the picker.
  const selectableRoster = roster.filter(
    (owner) => !owners.some((attached) => attached._id === owner._id)
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            {t("title")}
          </h2>
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            {t("add")}
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed p-8">
          <Spinner />
        </div>
      ) : owners.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <KeyRound className="size-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {owners.map((owner) => (
            <li
              key={owner._id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <Avatar>
                <AvatarFallback className="text-xs font-semibold">
                  {initials(owner.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {owner.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[owner.email, owner.phone].filter(Boolean).join(" · ") ||
                    tm("no_contact_info")}
                </p>
              </div>
              {canManage && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("remove")}
                  disabled={detachOwner.isPending}
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    detachOwner.mutate({
                      propertyIdOrSlug,
                      ownerId: owner._id,
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (isSaving) return;
          setDialogOpen(open);
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("dialog_title")}</DialogTitle>
            <DialogDescription>{t("dialog_description")}</DialogDescription>
          </DialogHeader>
          <ContactsSelector
            namespace="properties.owners"
            contacts={selectableRoster}
            isPending={rosterPending}
            selectedIds={selectedIds}
            onToggleExisting={(ownerId) =>
              setSelectedIds((current) =>
                current.includes(ownerId)
                  ? current.filter((id) => id !== ownerId)
                  : [...current, ownerId]
              )
            }
            newContacts={newOwners}
            onChangeNewContacts={setNewOwners}
            disabled={isSaving}
            emptyIcon={KeyRound}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={() => {
                setDialogOpen(false);
                resetDialog();
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={
                isSaving ||
                (selectedIds.length === 0 && newOwners.length === 0)
              }
              className="gap-2"
            >
              {isSaving && <Loader className="size-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
