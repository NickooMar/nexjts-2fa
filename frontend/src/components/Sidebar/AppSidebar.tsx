"use client";

import {
  Home,
  Layers,
  ChevronRight,
  Building,
  Users,
  FileText,
  FileSignature,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavUser } from "./NavUser";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface NavigationItem {
  titleKey: string;
  icon?: React.ElementType;
  items?: NavigationItem[];
  redirect?: string;
}

const navigationItems: NavigationItem[] = [
  {
    titleKey: "sections.platform",
    items: [
      { titleKey: "items.tenants", icon: Users, redirect: "/tenants" },
      { titleKey: "items.reports", icon: FileText, redirect: "/reports" },
      { titleKey: "items.dashboard", icon: Layers, redirect: "/dashboard" },
      { titleKey: "items.properties", icon: Building, redirect: "/properties" },
      {
        titleKey: "items.contracts",
        icon: FileSignature,
        redirect: "/contracts",
      },
    ],
  },
];

export function AppSidebar() {
  const router = useRouter();
  const t = useTranslations("sidebar");
  const { state, setOpen } = useSidebar();
  const { data: session } = useSession({ required: false });

  const handleMajorItemClick = () => {
    if (state === "collapsed") setOpen(true);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item?.redirect) router.push(item.redirect);
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
                {section?.items?.map((item) =>
                  item?.items ? (
                    <Collapsible
                      key={item.titleKey}
                      asChild
                      defaultOpen
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={t(item.titleKey)}
                            className="group-data-[collapsible=icon]:ml-2"
                            onClick={handleMajorItemClick}
                          >
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{t(item.titleKey)}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item?.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.titleKey}>
                                <SidebarMenuSubButton asChild>
                                  <button
                                    className="w-full"
                                    type="button"
                                    onClick={() =>
                                      subItem.redirect &&
                                      router.push(subItem.redirect)
                                    }
                                  >
                                    {subItem.icon && (
                                      <subItem.icon className="h-4 w-4" />
                                    )}
                                    <span>{t(subItem.titleKey)}</span>
                                  </button>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.titleKey}>
                      <SidebarMenuButton
                        className="group-data-[collapsible=icon]:ml-2"
                        onClick={() => handleItemClick(item)}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{t(item.titleKey)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
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
