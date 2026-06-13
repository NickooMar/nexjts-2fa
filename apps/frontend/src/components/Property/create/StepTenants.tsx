"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTenants } from "@/hooks/queries/use-tenants";
import { ContactsSelector } from "@/components/Property/contacts/ContactsSelector";
import { NewTenantDraft } from "./wizard.helpers";

interface StepTenantsProps {
  selectedTenantIds: string[];
  newTenants: NewTenantDraft[];
  disabled?: boolean;
  onToggleExisting: (tenantId: string) => void;
  onChangeNewTenants: (drafts: NewTenantDraft[]) => void;
}

/**
 * Optional wizard step: the property's tenants (renters). A thin wrapper that
 * binds the shared {@link ContactsSelector} to the tenant roster.
 */
export function StepTenants({
  selectedTenantIds,
  newTenants,
  disabled,
  onToggleExisting,
  onChangeNewTenants,
}: StepTenantsProps) {
  const t = useTranslations("properties.new");
  const { data: existingTenants, isPending } = useTenants();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("steps.tenants.title")}</CardTitle>
          <CardDescription>{t("steps.tenants.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactsSelector
            namespace="properties.tenants"
            contacts={existingTenants ?? []}
            isPending={isPending}
            selectedIds={selectedTenantIds}
            onToggleExisting={onToggleExisting}
            newContacts={newTenants}
            onChangeNewContacts={onChangeNewTenants}
            disabled={disabled}
            emptyIcon={Users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
