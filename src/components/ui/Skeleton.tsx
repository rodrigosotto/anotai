import { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(shimmer);
    };
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-300, 300]) },
    ],
  }));

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.55)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#E8E6E1",
    overflow: "hidden",
  },
});
