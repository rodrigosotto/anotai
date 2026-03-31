const NOTE_ACCENT_COLORS = [
  "#5C8FD6",
  "#E07B54",
  "#5BAD72",
  "#9B6DC5",
  "#D95F5F",
  "#3AADA8",
  "#E0A83A",
  "#4A8BC4",
] as const;

export function getNoteColor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return NOTE_ACCENT_COLORS[sum % NOTE_ACCENT_COLORS.length];
}

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  danger: string;
  border: string;
  borderStrong: string;
  skeleton: string;
  skeletonShimmer: string;
  cardShadow: string;
  deleteButton: string;
}

export const lightPalette: ColorPalette = {
  background: "#F8F7F4",
  surface: "#FFFFFF",
  surfaceSecondary: "#F0EFEC",
  textPrimary: "#1A1917",
  textSecondary: "#6B6966",
  textTertiary: "#9BA1A6",
  accent: "#0a7ea4",
  danger: "#E5484D",
  border: "#E8E6E1",
  borderStrong: "#D0CEC9",
  skeleton: "#E8E6E1",
  skeletonShimmer: "rgba(255,255,255,0.6)",
  cardShadow: "#000",
  deleteButton: "#E5484D",
};

export const darkPalette: ColorPalette = {
  background: "#1A1917",
  surface: "#242220",
  surfaceSecondary: "#2E2C2A",
  textPrimary: "#F0EFEC",
  textSecondary: "#A8A5A1",
  textTertiary: "#6B6966",
  accent: "#1E9FCC",
  danger: "#F2555A",
  border: "#3A3836",
  borderStrong: "#4A4846",
  skeleton: "#2E2C2A",
  skeletonShimmer: "rgba(255,255,255,0.08)",
  cardShadow: "#000",
  deleteButton: "#F2555A",
};

export const palettes: Record<"light" | "dark", ColorPalette> = {
  light: lightPalette,
  dark: darkPalette,
};
