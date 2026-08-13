"use client";

import type { CSSProperties, ReactNode } from "react";

import { buildThemeStyle } from "@/lib/theme";
import type { PublicForm } from "@/lib/types";

interface ThemeProviderProps {
  form: PublicForm;
  children: ReactNode;
}

export function ThemeProvider({ form, children }: ThemeProviderProps) {
  const style = buildThemeStyle(
    form.theme_colors,
    form.theme_roundness,
    form.theme_font_size,
  ) as CSSProperties;

  return (
    <div className="rx-theme min-h-dvh w-full" style={style}>
      {children}
    </div>
  );
}
