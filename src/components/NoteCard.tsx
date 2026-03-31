import { useCallback } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  FadeOutLeft,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { getNoteColor } from "../theme/colors";
import type { Note } from "../types/note";

// ─── Constants ───────────────────────────────────────────────────────────────

const DELETE_BUTTON_WIDTH = 72;
const SWIPE_OPEN_THRESHOLD = DELETE_BUTTON_WIDTH / 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NoteCardProps {
  note: Note;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
  index?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NoteCard({ note, onPress, onDelete, index = 0 }: NoteCardProps) {
  const accent = getNoteColor(note.id);
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const handleDeleteConfirm = useCallback(() => {
    Alert.alert("Excluir nota", "Tem certeza que deseja excluir esta nota?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => onDelete(note.id),
      },
    ]);
  }, [note.id, onDelete]);

  const handleCardPress = useCallback(() => {
    if (isOpen.value) {
      isOpen.value = false;
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      onPress(note.id);
    }
  }, [note.id, onPress, translateX, isOpen]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      const newVal = (isOpen.value ? -DELETE_BUTTON_WIDTH : 0) + e.translationX;
      translateX.value = Math.max(-DELETE_BUTTON_WIDTH, Math.min(0, newVal));
    })
    .onEnd((e) => {
      const projected =
        (isOpen.value ? -DELETE_BUTTON_WIDTH : 0) + e.translationX;
      const shouldOpen = projected < -SWIPE_OPEN_THRESHOLD || e.velocityX < -0.8;

      if (shouldOpen) {
        translateX.value = withSpring(-DELETE_BUTTON_WIDTH, {
          damping: 20,
          stiffness: 200,
        });
        isOpen.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        isOpen.value = false;
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const enterDelay = Math.min(index * 50, 200);

  return (
    <Animated.View
      entering={FadeInDown.delay(enterDelay).duration(280)}
      exiting={FadeOutLeft.duration(220)}
      style={styles.outerContainer}
    >
      <View style={styles.innerContainer}>
        {/* Delete area revealed on left-swipe */}
        <View style={styles.deleteArea}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => runOnJS(handleDeleteConfirm)()}
            accessibilityLabel="Excluir nota"
            accessibilityRole="button"
          >
            <Text style={styles.deleteText}>Excluir</Text>
          </TouchableOpacity>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]}>
            <TouchableOpacity
              onPress={handleCardPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Nota: ${note.title || "Sem título"}`}
              style={styles.touchable}
            >
              <View style={[styles.accent, { backgroundColor: accent }]} />
              <View style={styles.content}>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {note.title.trim() || "Sem título"}
                </Text>
                {note.content.trim().length > 0 ? (
                  <Text
                    style={styles.preview}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {note.content}
                  </Text>
                ) : null}
                <Text style={styles.date}>
                  {dateFormatter.format(new Date(note.updated_at))}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  innerContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  deleteArea: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    backgroundColor: "#E5484D",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
  },
  touchable: {
    flex: 1,
    flexDirection: "row",
  },
  accent: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: "#687076",
    lineHeight: 18,
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: "#9BA1A6",
  },
});
