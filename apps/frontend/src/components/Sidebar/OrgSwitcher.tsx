"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useOrganizations } from "@/hooks/queries/use-organizations";
import { useSwitchOrganization } from "@/hooks/mutations/use-organization-mutations";
import { CreateOrganizationDialog } from "@/components/Organization/CreateOrganizationDialog";

export function OrgSwitcher() {
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Deferred until the dropdown opens; after the first fetch, reopening within
  // the stale window is served from cache with no request.
  const { data: organizations = [], isPending } = useOrganizations({
    enabled: open,
  });

  const switchOrganization = useSwitchOrganization({
    successMessage: "Switched organization",
    errorMessage: "Could not switch organization",
  });

  const currentTenantId = session?.user?.tenantId;
  const currentName =
    session?.user?.tenantName ?? session?.user?.tenantSlug ?? "Organization";
  const currentRole = session?.user?.role;

  const handleSwitch = (tenantId: string) => {
    if (tenantId === currentTenantId || switchOrganization.isPending) return;
    switchOrganization.mutate(tenantId);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
        >
          <div className="flex min-w-0 flex-col">
            <h3 className="truncate font-semibold">{currentName}</h3>
            {currentRole && (
              <p className="text-xs capitalize text-muted-foreground">
                {currentRole}
              </p>
            )}
          </div>
          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>

        {isPending && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <Loader className="size-4 animate-spin" /> Loading…
          </div>
        )}

        {!isPending &&
          organizations.map((org) => {
            const isCurrent = org.tenantId === currentTenantId;
            const isSwitching =
              switchOrganization.isPending &&
              switchOrganization.variables === org.tenantId;
            return (
              <DropdownMenuItem
                key={org.tenantId}
                className="cursor-pointer gap-2"
                onClick={() => handleSwitch(org.tenantId)}
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{org.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {org.role}
                  </span>
                </div>
                {isSwitching ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  isCurrent && <Check className="size-4" />
                )}
              </DropdownMenuItem>
            );
          })}

        {!isPending && organizations.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No organizations
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-muted-foreground"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" /> Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>

      <CreateOrganizationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </DropdownMenu>
  );
}
