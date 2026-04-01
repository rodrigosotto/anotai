import { useCallback, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SortOrder } from "../types/note";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SortOption {
  value: SortOrder;
  label: string;
  description: string;
}

const SORT_OPTIONS: SortOption[] = [
  {
    value: "newest",
    label: "Mais recentes",
    description: "Notas criadas mais recentemente primeiro",
  },
  {
    value: "oldest",
    label: "Mais antigas",
    description: "Notas criadas há mais tempo primeiro",
  },
  {
    value: "alpha",
    label: "Alfabética",
    description: "Ordenar por título de A a Z",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const SHEET_HEIGHT = 280;
const SWIPE_CLOSE_THRESHOLD = 60;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SortSheetProps {
  visible: boolean;
  currentSort: SortOrder;
  onSelect: (sort: SortOrder) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SortSheet({
  visible,
  currentSort,
  onSelect,
  onClose,
}: SortSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const open = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 220 });
    translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
  }, [backdropOpacity, translateY]);

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 260 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [backdropOpacity, translateY, onClose]);

  useEffect(() => {
    if (visible) {
      open();
    } else {
      translateY.value = SHEET_HEIGHT;
      backdropOpacity.value = 0;
    }
  }, [visible, open, backdropOpacity, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropOpacity.value = 1 - e.translationY / SHEET_HEIGHT;
      }
    })
    .onEnd((e) => {
      if (e.translationY > SWIPE_CLOSE_THRESHOLD || e.velocityY > 800) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
        backdropOpacity.value = withTiming(1, { duration: 180 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
            sheetStyle,
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.sheetTitle}>Ordenar notas</Text>

          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === currentSort;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onSelect(opt.value);
                  close();
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  active && styles.optionRowActive,
                  pressed && styles.optionRowPressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={opt.label}
              >
                <View style={styles.optionText}>
                  <Text
                    style={[styles.optionLabel, active && styles.optionLabelActive]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.optionDescription}>{opt.description}</Text>
                </View>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0CEC9",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 12,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  optionRowActive: {
    backgroundColor: "#EBF6FB",
  },
  optionRowPressed: {
    backgroundColor: "#F0EFEC",
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1917",
  },
  optionLabelActive: {
    color: "#0a7ea4",
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 12,
    color: "#6B6966",
  },
  checkmark: {
    fontSize: 17,
    color: "#0a7ea4",
    fontWeight: "700",
  },
});
