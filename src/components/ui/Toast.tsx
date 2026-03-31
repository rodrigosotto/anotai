import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ToastState, ToastType } from "../../context/ToastContext";

const TYPE_COLORS: Record<ToastType, string> = {
  success: "#2D9E6B",
  error: "#E5484D",
  info: "#0a7ea4",
};

interface ToastProps {
  toast: ToastState | null;
  onHide: () => void;
}

export function Toast({ toast, onHide }: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);

  useEffect(() => {
    if (!toast) return;

    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 250 }, (finished) => {
        if (finished) runOnJS(onHide)();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) return null;

  const bg = TYPE_COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, backgroundColor: bg },
        animStyle,
      ]}
    >
      <Text style={styles.message}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  message: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
