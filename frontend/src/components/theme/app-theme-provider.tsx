"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="typeform-app-theme"
    >
      {children}
    </NextThemesProvider>
  );
}

