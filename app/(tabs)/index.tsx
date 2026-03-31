import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import {
  useCallback,
  useDeferredValue,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NoteCard } from "@/src/components/NoteCard";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useNotes, type DateFilter } from "@/src/hooks/useNotes";
import type { Note } from "@/src/types/note";

// ─── Skeleton list ────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton width={4} height={88} borderRadius={0} />
          <View style={styles.skeletonContent}>
            <Skeleton width="60%" height={13} />
            <Skeleton width="90%" height={11} />
            <Skeleton width="30%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyAllNotes() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>Nenhuma nota ainda.</Text>
      <Text style={styles.emptySubtitle}>Crie a primeira!</Text>
    </View>
  );
}

function EmptySearch({ term }: { term: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>Nenhuma nota encontrada</Text>
      <Text style={styles.emptySubtitle}>para &quot;{term}&quot;</Text>
    </View>
  );
}

// ─── Date segmented control ───────────────────────────────────────────────────

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: "Todas", value: "all" },
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "week" },
  { label: "Este mês", value: "month" },
];

interface DateSegmentProps {
  selected: DateFilter;
  onChange: (v: DateFilter) => void;
}

function DateSegment({ selected, onChange }: DateSegmentProps) {
  return (
    <View style={styles.segmentRow}>
      {DATE_OPTIONS.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[styles.segmentLabel, active && styles.segmentLabelActive]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotesScreen() {
  const insets = useSafeAreaInsets();

  const [rawQuery, setRawQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);

  const deferredQuery = useDeferredValue(rawQuery);

  const { notes, isLoading, error, deleteNote, refresh } = useNotes({
    searchQuery: deferredQuery,
    dateFilter,
  });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // ── Search bar animation ──────────────────────────────────────────────────

  const searchHeight = useSharedValue(0);
  const searchInputRef = useRef<TextInput>(null);

  const toggleSearch = useCallback(() => {
    const opening = !searchOpen;
    setSearchOpen(opening);
    searchHeight.value = withTiming(opening ? 52 : 0, { duration: 220 });
    if (opening) {
      setTimeout(() => searchInputRef.current?.focus(), 230);
    } else {
      setRawQuery("");
    }
  }, [searchOpen, searchHeight]);

  const searchWrapStyle = useAnimatedStyle(() => ({
    height: searchHeight.value,
    overflow: "hidden",
  }));

  // ── FAB scale animation ───────────────────────────────────────────────────

  const fabScale = useSharedValue(1);

  const onFabPressIn = useCallback(() => {
    fabScale.value = withSpring(0.88, { damping: 15, stiffness: 300 });
  }, [fabScale]);

  const onFabPressOut = useCallback(() => {
    fabScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [fabScale]);

  const fabScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const onFabPress = useCallback(() => {
    router.push("/(tabs)/new");
  }, []);

  // ── FlashList handlers ────────────────────────────────────────────────────

  const handleNotePress = useCallback((id: string) => {
    router.push(`/note/${id}`);
  }, []);

  const handleNoteDelete = useCallback(
    (id: string) => {
      deleteNote(id);
    },
    [deleteNote],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Note; index: number }) => (
      <NoteCard
        note={item}
        onPress={handleNotePress}
        onDelete={handleNoteDelete}
        index={index}
      />
    ),
    [handleNotePress, handleNoteDelete],
  );

  const keyExtractor = useCallback((item: Note) => item.id, []);

  // ── Derived display values ────────────────────────────────────────────────

  const isSearching = deferredQuery.trim().length > 0;
  const isFiltered = isSearching || dateFilter !== "all";

  const counterLabel = isSearching
    ? `${notes.length} resultado${notes.length !== 1 ? "s" : ""}`
    : `${notes.length} nota${notes.length !== 1 ? "s" : ""}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Minhas Notas</Text>
          {!isLoading && (
            <Text style={styles.headerCount}>{counterLabel}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={toggleSearch}
          style={styles.headerIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={searchOpen ? "Fechar busca" : "Abrir busca"}
          accessibilityRole="button"
        >
          <Text style={styles.headerIcon}>{searchOpen ? "✕" : "🔍"}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Animated search bar ── */}
      <Animated.View
        style={[styles.searchWrap, searchWrapStyle]}
        pointerEvents={searchOpen ? "auto" : "none"}
      >
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Buscar notas…"
          placeholderTextColor="#9BA1A6"
          value={rawQuery}
          onChangeText={setRawQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Campo de busca"
        />
      </Animated.View>

      {/* ── Date segmented control ── */}
      <DateSegment selected={dateFilter} onChange={setDateFilter} />

      {/* ── Content ── */}
      {error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Erro ao carregar notas</Text>
          <Text style={styles.emptySubtitle}>{error.message}</Text>
        </View>
      ) : isLoading ? (
        <SkeletonList />
      ) : notes.length === 0 ? (
        isFiltered ? (
          <EmptySearch term={deferredQuery.trim() || "filtro selecionado"} />
        ) : (
          <EmptyAllNotes />
        )
      ) : (
        <FlashList
          data={notes}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── FAB ── */}
      <Animated.View
        entering={ZoomIn.springify().damping(14)}
        style={[
          styles.fab,
          { bottom: insets.bottom + 24 },
          fabScaleStyle,
        ]}
      >
        <TouchableOpacity
          onPress={onFabPress}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
          accessibilityLabel="Criar nova nota"
          accessibilityRole="button"
          style={styles.fabInner}
        >
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#11181C",
    letterSpacing: -0.5,
  },
  headerCount: {
    fontSize: 12,
    color: "#687076",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDEDED",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    fontSize: 15,
  },
  // Search bar
  searchWrap: {
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#11181C",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginTop: 4,
  },
  // Segmented control
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#E5E5EA",
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentLabel: {
    fontSize: 12,
    color: "#687076",
    fontWeight: "500",
  },
  segmentLabelActive: {
    color: "#11181C",
    fontWeight: "600",
  },
  // List
  listContent: {
    paddingTop: 4,
    paddingBottom: 100,
  },
  // Empty / error states
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    lineHeight: 20,
  },
  // Skeleton
  skeletonContainer: {
    paddingTop: 4,
    paddingHorizontal: 16,
    gap: 10,
  },
  skeletonCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    height: 88,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  // FAB
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0a7ea4",
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
  },
  fabIcon: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "300",
  },
});
