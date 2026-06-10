import { auth } from "@/auth";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PropertyDetailsClient from "./PropertyDetailsClient";
import { getPropertyAction } from "@/app/actions/property.actions";

interface PropertyDetailsPageProps {
  params: Promise<{ slug: string }>;
}

/** Roles allowed to create/update/delete properties (mirrors the backend). */
const MANAGER_ROLES = ["owner", "admin", "manager"];

export async function generateMetadata({
  params,
}: PropertyDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { property } = await getPropertyAction(slug);
  return {
    title: property ? property.name : "Property",
    description: property?.description ?? "Property details",
  };
}

export default async function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
  const { slug } = await params;
  const session = await auth();

  // No organization → no tenant database to read from. Treat as not-found
  // rather than firing a request the gateway rejects with missing_tenant_context.
  if (!session?.user?.tenantId) {
    notFound();
  }

  const result = await getPropertyAction(slug);

  if (!result.success || !result.property) {
    notFound();
  }

  return (
    <PropertyDetailsClient
      property={result.property}
      canManage={MANAGER_ROLES.includes(session?.user?.role ?? "")}
      organization={{
        name: session?.user?.tenantName,
        slug: session?.user?.tenantSlug,
      }}
    />
  );
}
