"use client";

import {
  Home,
  Star,
  Layers,
  History,
  FileText,
  Settings,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarMenu,
  SidebarRail,
  SidebarGroup,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

const navigationItems = [
  {
    titleKey: "sections.platform",
    items: [
      {
        titleKey: "items.playground",
        icon: Layers,
        items: [
          { titleKey: "items.history", icon: History },
          { titleKey: "items.starred", icon: Star },
          { titleKey: "items.settings", icon: Settings },
        ],
      },
      { titleKey: "items.models", icon: LayoutDashboard },
      { titleKey: "items.documentation", icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const { data: session } = useSession({ required: false });
  const t = useTranslations("sidebar");
  const { state, setOpen } = useSidebar();

  const handleMajorItemClick = () => {
    if (state === "collapsed") {
      setOpen(true);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/50 p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <div className="rounded-lg bg-primary p-1 group-data-[collapsible=icon]:hidden">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h3 className="font-semibold">{t("organization.name")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("organization.plan")}
            </p>
          </div>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-2" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.titleKey}>
            <SidebarGroupLabel>{t(section.titleKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      className="group-data-[collapsible=icon]:ml-2"
                    >
                      <button
                        className="w-full"
                        type="button"
                        onClick={handleMajorItemClick}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                        {item.items && (
                          <span className="ml-auto group-data-[collapsible=icon]:hidden">
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    </SidebarMenuButton>
                    {item.items && (
                      <SidebarMenu className="pl-4 group-data-[collapsible=icon]:hidden">
                        {item.items.map((subItem) => (
                          <SidebarMenuItem key={subItem.titleKey}>
                            <SidebarMenuButton asChild>
                              <button className="w-full">
                                <subItem.icon className="h-4 w-4" />
                                <span>{t(subItem.titleKey)}</span>
                              </button>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4 group-data-[collapsible=icon]:p-2">
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
