"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Trees, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case 'forest':
        return <Trees className="h-[1.2rem] w-[1.2rem]" />;
      case 'sunset':
        return <Sunset className="h-[1.2rem] w-[1.2rem]" />;
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={theme === "light" ? "bg-accent" : ""}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent" : ""}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("forest")}
          className={theme === "forest" ? "bg-accent" : ""}
        >
          <Trees className="mr-2 h-4 w-4" />
          Forest
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("sunset")}
          className={theme === "sunset" ? "bg-accent" : ""}
        >
          <Sunset className="mr-2 h-4 w-4" />
          Sunset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 