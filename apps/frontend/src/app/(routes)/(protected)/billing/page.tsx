import { auth } from "@/auth";
import { Metadata } from "next";
import BillingClient from "./BillingClient";
import { NoOrganizationState } from "@/components/Organization/NoOrganizationState";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your organization's subscription, usage and invoices",
};

/** Roles allowed to mutate the subscription (mirrors the backend). */
const BILLING_MANAGER_ROLES = ["owner"];

export default async function BillingPage() {
  const session = await auth();

  // Billing is organization-scoped: without an active organization there is
  // no subscription to show — prompt to create/join one instead.
  if (!session?.user?.tenantId) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <NoOrganizationState />
      </div>
    );
  }

  return (
    <BillingClient
      organizationName={session.user.tenantName ?? session.user.tenantSlug}
      canManage={BILLING_MANAGER_ROLES.includes(session.user.role ?? "")}
    />
  );
}
