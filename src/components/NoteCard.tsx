import { useCallback, useRef } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PanGestureHandler,
  State,
  type GestureEvent,
  type HandlerStateChangeEvent,
  type PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";

import type { Note } from "../types/note";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT_PALETTE = [
  "#4A90D9",
  "#E8854A",
  "#5BAD72",
  "#9B59B6",
  "#E74C3C",
  "#1ABC9C",
  "#F39C12",
  "#2980B9",
];

const DELETE_BUTTON_WIDTH = 72;
const SWIPE_OPEN_THRESHOLD = DELETE_BUTTON_WIDTH / 2;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function accentColorFromId(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return ACCENT_PALETTE[sum % ACCENT_PALETTE.length];
}

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
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NoteCard({ note, onPress, onDelete }: NoteCardProps) {
  const accent = accentColorFromId(note.id);
  const translateX = useRef(new Animated.Value(0)).current;
  const savedOffset = useRef(0);
  const isOpen = useRef(false);

  // Stable reference — translateX Animated.Value never changes
  const onGestureEvent = useRef(
    Animated.event<GestureEvent<PanGestureHandlerEventPayload>>(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true },
    ),
  ).current;

  const onHandlerStateChange = useCallback(
    (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      const { state, translationX, velocityX } = event.nativeEvent;

      if (state === State.BEGAN) {
        // Anchor the Animated.Value to the current resting position
        translateX.setOffset(savedOffset.current);
        translateX.setValue(0);
      } else if (
        state === State.END ||
        state === State.CANCELLED ||
        state === State.FAILED
      ) {
        translateX.flattenOffset();
        const projected = savedOffset.current + translationX;
        let toValue: number;

        if (projected < -SWIPE_OPEN_THRESHOLD || velocityX < -0.8) {
          toValue = -DELETE_BUTTON_WIDTH;
          isOpen.current = true;
        } else {
          toValue = 0;
          isOpen.current = false;
        }

        savedOffset.current = toValue;
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          bounciness: 2,
        }).start();
      }
    },
    [translateX],
  );

  const handleCardPress = useCallback(() => {
    if (isOpen.current) {
      savedOffset.current = 0;
      isOpen.current = false;
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      onPress(note.id);
    }
  }, [note.id, onPress, translateX]);

  const handleDeletePress = useCallback(() => {
    Alert.alert("Excluir nota", "Tem certeza que deseja excluir esta nota?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => onDelete(note.id),
      },
    ]);
  }, [note.id, onDelete]);

  return (
    // Outer view carries the shadow — not clipped by overflow:hidden
    <View style={styles.outerContainer}>
      {/* Inner container clips the horizontal swipe */}
      <View style={styles.innerContainer}>
        {/* Delete area revealed on left-swipe */}
        <View style={styles.deleteArea}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeletePress}
            accessibilityLabel="Excluir nota"
            accessibilityRole="button"
          >
            <Text style={styles.deleteText}>Excluir</Text>
          </TouchableOpacity>
        </View>

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-5, 5]}
        >
          <Animated.View
            style={[styles.card, { transform: [{ translateX }] }]}
          >
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
        </PanGestureHandler>
      </View>
    </View>
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
    backgroundColor: "#E74C3C",
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
