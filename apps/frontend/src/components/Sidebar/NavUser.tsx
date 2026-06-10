"use client";

import {
  Bell,
  LogOut,
  Palette,
  Languages,
  CreditCard,
  BadgeCheck,
  ChevronsUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuGroup,
  DropdownMenuSubTrigger,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function NavUser({
  user,
}: {
  user: {
    _id: string;
    email: string;
    image: string;
    lastName: string;
    firstName: string;
  };
}) {
  const { isMobile } = useSidebar();
  const t = useTranslations("sidebar");
  const tGeneral = useTranslations("general");
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const darkThemeOptions = [
    { id: "dark", label: "Dark" },
    { id: "dark-warm", label: "Dark Warm" },
    { id: "dark-alt", label: "Dark Alt" },
  ];

  const lightThemeOptions = [
    { id: "light", label: "Light" },
    { id: "forest", label: "Forest" },
    { id: "sunset", label: "Sunset" },
  ];

  const languageOptions = [
    { id: "es", label: tGeneral("languages.spanish") },
    { id: "en", label: tGeneral("languages.english") },
  ];

  if (!user) return null;

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  const handleLanguageChange = (value: string) => {
    const nextLocale = value as (typeof routing.locales)[number];
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.image} alt={user.firstName} />
                <AvatarFallback className="rounded-lg">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image} alt={user.firstName} />
                  <AvatarFallback className="rounded-lg">
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                {t("user_menu.account")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                {t("user_menu.billing")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                {t("user_menu.notifications")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette />
                {t("user_menu.theme")}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent sideOffset={6}>
                  <DropdownMenuLabel>{t("user_menu.theme")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={theme || "system"}
                    onValueChange={setTheme}
                  >
                    {darkThemeOptions.map((option) => (
                      <DropdownMenuRadioItem key={option.id} value={option.id}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={theme || "system"}
                    onValueChange={setTheme}
                  >
                    {lightThemeOptions.map((option) => (
                      <DropdownMenuRadioItem key={option.id} value={option.id}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Languages />
                {t("user_menu.language")}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent sideOffset={6}>
                  <DropdownMenuLabel>{t("user_menu.language")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={locale}
                    onValueChange={handleLanguageChange}
                  >
                    {languageOptions.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.id}
                        value={option.id}
                        disabled={isPending}
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut />
              {t("user_menu.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
