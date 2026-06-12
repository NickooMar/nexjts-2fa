import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { NoOrganizationState } from "@/components/Organization/NoOrganizationState";
import { PropertyCreateWizard } from "@/components/Property/create/PropertyCreateWizard";

export const metadata: Metadata = {
  title: "Create property",
  description: "Create a new property step by step",
};

/** Roles allowed to create/update/delete properties (mirrors the backend). */
const MANAGER_ROLES = ["owner", "admin", "manager"];
const BILLING_MANAGER_ROLES = ["owner"];

export default async function NewPropertyPage() {
  const session = await auth();

  // Properties are tenant-scoped: with no organization the gateway rejects
  // every request, so prompt for one instead (mirrors the list page).
  if (!session?.user?.tenantId) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <NoOrganizationState />
      </div>
    );
  }

  // Members without the manager roles can browse but not create.
  if (!MANAGER_ROLES.includes(session.user.role ?? "")) {
    redirect("/properties");
  }

  return (
    <PropertyCreateWizard
      canManageBilling={BILLING_MANAGER_ROLES.includes(session.user.role ?? "")}
    />
  );
}
