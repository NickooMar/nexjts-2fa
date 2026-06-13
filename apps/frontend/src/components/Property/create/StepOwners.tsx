"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOwners } from "@/hooks/queries/use-owners";
import { ContactsSelector } from "@/components/Property/contacts/ContactsSelector";
import { NewContactDraft } from "./wizard.helpers";

interface StepOwnersProps {
  selectedOwnerIds: string[];
  newOwners: NewContactDraft[];
  disabled?: boolean;
  onToggleExisting: (ownerId: string) => void;
  onChangeNewOwners: (drafts: NewContactDraft[]) => void;
}

/**
 * Optional wizard step: the property's owners. A thin wrapper that binds the
 * shared {@link ContactsSelector} to the (separate) owner roster.
 */
export function StepOwners({
  selectedOwnerIds,
  newOwners,
  disabled,
  onToggleExisting,
  onChangeNewOwners,
}: StepOwnersProps) {
  const t = useTranslations("properties.new");
  const { data: existingOwners, isPending } = useOwners();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("steps.owners.title")}</CardTitle>
          <CardDescription>{t("steps.owners.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsSelector
            namespace="properties.owners"
            contacts={existingOwners ?? []}
            isPending={isPending}
            selectedIds={selectedOwnerIds}
            onToggleExisting={onToggleExisting}
            newContacts={newOwners}
            onChangeNewContacts={onChangeNewOwners}
            disabled={disabled}
            emptyIcon={KeyRound}
          />
        </CardContent>
      </Card>
    </div>
  );
}
