"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      themes={["light", "forest", "sunset", "dark", "dark-warm", "dark-alt"]}
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
