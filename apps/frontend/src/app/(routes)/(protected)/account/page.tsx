import { auth } from "@/auth";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Account",
  description: "Review your profile and workspace details",
};

export default async function AccountPage() {
  const session = await auth();
  const user = session?.user;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Badge variant="secondary">Account</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{fullName}</h1>
            <p className="text-sm text-muted-foreground">
              Review your personal information, role and active workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Core identity details from your authenticated session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Full name</p>
                <p className="font-medium">{fullName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email ?? "Not available"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{user?._id ?? "Not available"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>
                The organization and permissions currently associated with your
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Organization</p>
                <p className="font-medium">
                  {user?.tenantName ?? user?.tenantSlug ?? "No organization"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Role</p>
                <p className="font-medium capitalize">
                  {user?.role ?? "Not assigned"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Tenant ID</p>
                <p className="font-mono text-xs">
                  {user?.tenantId ?? "Not available"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
