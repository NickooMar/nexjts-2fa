import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

type NotificationItem = {
  title: string;
  description: string;
  category: "Billing" | "Operations" | "System";
  time: string;
};

const notifications: NotificationItem[] = [
  {
    title: "Subscription updated",
    description: "Your billing cycle and invoice history are now available.",
    category: "Billing",
    time: "Just now",
  },
  {
    title: "Portfolio activity synced",
    description: "Recent property and tenant events were refreshed successfully.",
    category: "Operations",
    time: "2 hours ago",
  },
  {
    title: "Workspace ready",
    description: "Your account preferences and organization context are active.",
    category: "System",
    time: "Today",
  },
];

export const metadata: Metadata = {
  title: "Notifications",
  description: "Review recent account, billing and workspace updates",
};

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Badge variant="secondary">Notifications</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Notification center
            </h1>
            <p className="text-sm text-muted-foreground">
              Track the latest updates across your account and workspace.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card key={`${notification.category}-${notification.title}`}>
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {notification.title}
                    </CardTitle>
                    <Badge variant="outline">{notification.category}</Badge>
                  </div>
                  <CardDescription>{notification.description}</CardDescription>
                </div>
                <span className="text-xs text-muted-foreground">
                  {notification.time}
                </span>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                This screen is now wired into the user menu and ready for real
                notification data when the backend feed is available.
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
