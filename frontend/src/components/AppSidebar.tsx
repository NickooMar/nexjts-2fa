import { Home, History, Star, Settings, Layers, FileText, LayoutDashboard, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Platform",
    items: [
      {
        title: "Playground",
        icon: Layers,
        items: [
          { title: "History", icon: History },
          { title: "Starred", icon: Star },
          { title: "Settings", icon: Settings },
        ],
      },
      { title: "Models", icon: LayoutDashboard },
      { title: "Documentation", icon: FileText },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-1">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold">Acme Inc</h3>
            <p className="text-xs text-muted-foreground">Enterprise</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <button className="w-full">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.items && (
                          <span className="ml-auto">
                            <ChevronDown className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    </SidebarMenuButton>
                    {item.items && (
                      <SidebarMenu className="pl-4">
                        {item.items.map((subItem) => (
                          <SidebarMenuItem key={subItem.title}>
                            <SidebarMenuButton asChild>
                              <button className="w-full">
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
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

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-muted p-1">
            <div className="h-6 w-6 rounded-full bg-foreground/10" />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">shadcn</p>
            <p className="text-xs text-muted-foreground">m@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
} 