import { useColorScheme } from "react-native";
import { useMemo } from "react";

import { palettes, type ColorPalette } from "./colors";
import { spacing, borderRadius, typography } from "./tokens";

export interface Theme {
  colors: ColorPalette;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return useMemo(
    () => ({
      colors: palettes[scheme === "dark" ? "dark" : "light"],
      spacing,
      borderRadius,
      typography,
      isDark: scheme === "dark",
    }),
    [scheme],
  );
}
