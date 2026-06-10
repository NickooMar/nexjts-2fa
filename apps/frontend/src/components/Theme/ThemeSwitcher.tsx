"use client";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Trees, Sunset, Coffee, Eclipse } from "lucide-react";

// Theme configuration
const themeConfig = {
  dark: [
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "dark-warm", icon: Coffee, label: "Dark Warm" },
    { id: "dark-alt", icon: Eclipse, label: "Dark Alt" },
  ],
  light: [
    { id: "light", icon: Sun, label: "Light" },
    { id: "forest", icon: Trees, label: "Forest" },
    { id: "sunset", icon: Sunset, label: "Sunset" },
  ],
} as const;

export function ThemeSwitcher() {
  const t = useTranslations("themes");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const getThemeIcon = () => {
    const allThemes = [...themeConfig.dark, ...themeConfig.light];
    const currentTheme = allThemes.find((t) => t.id === theme);
    const Icon = currentTheme?.icon || Sun;
    return <Icon className="h-[1.2rem] w-[1.2rem]" />;
  };

  const ThemeGroup = ({
    themes,
  }: {
    themes: typeof themeConfig.dark | typeof themeConfig.light;
  }) => (
    <DropdownMenuGroup>
      {themes.map(({ id, label, icon: Icon }) => (
        <DropdownMenuItem
          key={id}
          onClick={() => setTheme(id)}
          className={theme === id ? "my-2 bg-accent" : "my-2"}
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("title")}</DropdownMenuLabel>
        <DropdownMenuSeparator className="mb-2" />
        <ThemeGroup themes={themeConfig.dark} />
        <DropdownMenuSeparator className="my-2" />
        <ThemeGroup themes={themeConfig.light} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
