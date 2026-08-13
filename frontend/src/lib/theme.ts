import type { CSSProperties } from "react";

import type { ThemeColors, ThemeFontSize, ThemeRoundness } from "@/lib/types";

export const ROUNDNESS_PX: Record<ThemeRoundness, number> = {
  none: 0,
  small: 8,
  large: 32,
};

export const FONT_SCALE: Record<
  ThemeFontSize,
  {
    questionTitle: { desktop: number; mobile: number };
    description: { desktop: number; mobile: number };
    input: { desktop: number; mobile: number };
    helper: { desktop: number; mobile: number };
  }
> = {
  small: {
    questionTitle: { desktop: 22, mobile: 18 },
    description: { desktop: 16, mobile: 14 },
    input: { desktop: 22, mobile: 18 },
    helper: { desktop: 14, mobile: 14 },
  },
  medium: {
    questionTitle: { desktop: 26, mobile: 20 },
    description: { desktop: 18, mobile: 16 },
    input: { desktop: 26, mobile: 20 },
    helper: { desktop: 14, mobile: 14 },
  },
  large: {
    questionTitle: { desktop: 30, mobile: 24 },
    description: { desktop: 20, mobile: 18 },
    input: { desktop: 30, mobile: 24 },
    helper: { desktop: 14, mobile: 14 },
  },
};

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function withOpacity(hex: string, opacity: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

export function isLightBackground(hex: string): boolean {
  const { r, g, b } = parseHex(hex);
  const { s, v } = rgbToHsv(r, g, b);
  return v > 0.5 + Math.pow(s, 1.6) * 0.5;
}

export function buildThemeStyle(
  colors: ThemeColors,
  roundness: ThemeRoundness,
  fontSize: ThemeFontSize,
): CSSProperties {
  const scale = FONT_SCALE[fontSize];
  const radius = ROUNDNESS_PX[roundness];

  return {
    ["--rx-answer" as string]: colors.answer,
    ["--rx-background" as string]: colors.background,
    ["--rx-button" as string]: colors.button,
    ["--rx-question" as string]: colors.question,
    ["--rx-button-content" as string]: colors.button_content,
    ["--rx-answer-idle" as string]: withOpacity(colors.answer, 0.06),
    ["--rx-answer-hover" as string]: withOpacity(colors.answer, 0.1),
    ["--rx-bg-selected" as string]: withOpacity(colors.background, 0.04),
    ["--rx-bg-active" as string]: withOpacity(colors.background, 0.5),
    ["--rx-radius" as string]: `${radius}px`,
    ["--rx-font-question-title" as string]: `${scale.questionTitle.desktop}px`,
    ["--rx-font-question-title-mobile" as string]: `${scale.questionTitle.mobile}px`,
    ["--rx-font-description" as string]: `${scale.description.desktop}px`,
    ["--rx-font-description-mobile" as string]: `${scale.description.mobile}px`,
    ["--rx-font-input" as string]: `${scale.input.desktop}px`,
    ["--rx-font-input-mobile" as string]: `${scale.input.mobile}px`,
    ["--rx-font-helper" as string]: `${scale.helper.desktop}px`,
    backgroundColor: colors.background,
    color: colors.question,
  };
}
