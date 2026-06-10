import { auth } from "@/auth";
import { Metadata } from "next";
import PropertiesClient from "./PropertiesClient";
import { listPropertiesAction } from "@/app/actions/property.actions";
import { NoOrganizationState } from "@/components/Organization/NoOrganizationState";

export const metadata: Metadata = {
  title: "Properties",
  description: "Manage your organization's properties",
};

/** Roles allowed to create/update/delete properties (mirrors the backend). */
const MANAGER_ROLES = ["owner", "admin", "manager"];

export default async function PropertiesPage() {
  const session = await auth();

  // Properties are tenant-scoped: with no organization the gateway rejects the
  // request with `missing_tenant_context`. Mirror the dashboard and prompt the
  // user to create or join one instead of firing a doomed request.
  if (!session?.user?.tenantId) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <NoOrganizationState />
      </div>
    );
  }

  // Server-side prefetch: passed to the client as React Query `initialData`
  // so the first paint is instant. If it fails, the client query refetches
  // and owns the error/retry UX.
  const { success, properties } = await listPropertiesAction();

  return (
    <PropertiesClient
      organizationName={session.user.tenantName ?? session.user.tenantSlug}
      canManage={MANAGER_ROLES.includes(session.user.role ?? "")}
      initialProperties={success ? properties : undefined}
    />
  );
}
