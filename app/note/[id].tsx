import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNoteRepository } from "@/src/repositories/noteRepository";
import { noteSchema, type NoteFormValues } from "@/src/schemas/noteSchema";
import { Skeleton } from "@/src/components/ui/Skeleton";
import type { Note } from "@/src/types/note";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── Animated inline error ────────────────────────────────────────────────────

function AnimatedError({ message }: { message?: string }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(message ? 1 : 0, { duration: 220 });
  }, [message, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!message) return null;

  return (
    <Animated.View style={animStyle}>
      <Text style={styles.errorText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Skeleton fallback ────────────────────────────────────────────────────────

function NoteSkeleton() {
  return (
    <View style={styles.skeleton}>
      <Skeleton width="70%" height={28} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="85%" height={14} />
      <Skeleton width="60%" height={14} />
      <View style={{ marginTop: 16 }}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="75%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// ─── Entry point (Suspense wrapper) ──────────────────────────────────────────

export default function NoteDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  return (
    <Suspense fallback={<NoteSkeleton />}>
      <NoteContent id={id} />
    </Suspense>
  );
}

// ─── Inner component (uses React 19 `use()` for data loading) ────────────────

function NoteContent({ id }: { id: string }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const repo = useNoteRepository();

  const notePromise = useMemo(
    () => repo.getNoteById(id).catch(() => null),
    [id, repo],
  );

  const initialNote = use(notePromise);

  const [note, setNote] = useState<Note | null>(initialNote);
  const [isEditing, setIsEditing] = useState(false);

  const { control, handleSubmit, reset, formState, watch } =
    useForm<NoteFormValues>({
      resolver: zodResolver(noteSchema),
      defaultValues: {
        title: note?.title ?? "",
        content: note?.content ?? "",
      },
      mode: "onChange",
    });

  const contentLength = (watch("content") ?? "").length;
  const isNearLimit = contentLength > 9_500;
  const contentRef = useRef<TextInput>(null);

  // ── Edit mode handlers ────────────────────────────────────────────────────

  const startEditing = useCallback(() => {
    if (!note) return;
    reset({ title: note.title, content: note.content });
    setIsEditing(true);
  }, [note, reset]);

  const cancelEditing = useCallback(() => {
    if (!note) return;
    reset({ title: note.title, content: note.content });
    setIsEditing(false);
  }, [note, reset]);

  const onSaveEdit = useCallback(
    async (values: NoteFormValues) => {
      if (!note) return;
      const updated = await repo.updateNote(note.id, values);
      setNote(updated);
      setIsEditing(false);
    },
    [note, repo],
  );

  const submitEdit = useCallback(() => {
    handleSubmit(onSaveEdit)();
  }, [handleSubmit, onSaveEdit]);

  // ── Delete handler ────────────────────────────────────────────────────────

  const onDelete = useCallback(() => {
    if (!note) return;
    Alert.alert(
      "Excluir nota",
      "Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await repo.deleteNote(note.id);
            router.replace("/(tabs)");
          },
        },
      ],
    );
  }, [note, repo]);

  // ── Header configuration ──────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (isEditing) {
      navigation.setOptions({
        title: "Editar Nota",
        headerRight: () =>
          formState.isSubmitting ? (
            <ActivityIndicator size="small" style={styles.headerLoader} />
          ) : (
            <TouchableOpacity
              onPress={submitEdit}
              disabled={!formState.isValid || formState.isSubmitting}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Salvar edição"
            >
              <Text
                style={[
                  styles.headerAction,
                  (!formState.isValid || formState.isSubmitting) &&
                    styles.headerActionDisabled,
                ]}
              >
                Salvar
              </Text>
            </TouchableOpacity>
          ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={cancelEditing}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Cancelar edição"
          >
            <Text style={styles.headerCancel}>Cancelar</Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        title: note?.title ?? "Nota",
        headerRight: note
          ? () => (
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={startEditing}
                  hitSlop={hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel="Editar nota"
                >
                  <Text style={styles.headerAction}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDelete}
                  hitSlop={hitSlop}
                  style={styles.headerTrash}
                  accessibilityRole="button"
                  accessibilityLabel="Excluir nota"
                >
                  <Text style={styles.headerTrashIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )
          : undefined,
        headerLeft: undefined,
      });
    }
  }, [
    navigation,
    isEditing,
    note,
    formState.isValid,
    formState.isSubmitting,
    submitEdit,
    startEditing,
    cancelEditing,
    onDelete,
  ]);

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!note) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundIcon}>📭</Text>
        <Text style={styles.notFoundTitle}>Nota não encontrada</Text>
        <Text style={styles.notFoundSubtitle}>
          Esta nota pode ter sido excluída.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.editScroll,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View style={styles.fieldWrap}>
                <TextInput
                  style={[styles.editTitleInput, !!error && styles.inputError]}
                  placeholder="Título da nota"
                  placeholderTextColor="#9BA1A6"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoFocus
                  maxLength={110}
                  returnKeyType="next"
                  onSubmitEditing={() => contentRef.current?.focus()}
                  accessibilityLabel="Título"
                />
                <AnimatedError message={error?.message} />
              </View>
            )}
          />

          {/* Content */}
          <Controller
            control={control}
            name="content"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View style={[styles.fieldWrap, styles.fieldFlex]}>
                <TextInput
                  ref={contentRef}
                  style={[styles.editContentInput, !!error && styles.inputError]}
                  placeholder="Conteúdo da nota"
                  placeholderTextColor="#9BA1A6"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Conteúdo"
                />
                <View style={styles.counterRow}>
                  <AnimatedError message={error?.message} />
                  <Text
                    style={[styles.counter, isNearLimit && styles.counterWarn]}
                  >
                    {contentLength} / 10.000
                  </Text>
                </View>
              </View>
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── View mode ─────────────────────────────────────────────────────────────

  const words = countWords(note.content);
  const createdAt = dateFormatter.format(new Date(note.created_at));
  const updatedAt = dateFormatter.format(new Date(note.updated_at));
  const wasEdited = note.updated_at !== note.created_at;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.viewScroll,
        { paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Text style={styles.viewTitle} selectable>
        {note.title}
      </Text>

      <Text style={styles.viewBody} selectable>
        {note.content}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Criada em {createdAt}</Text>
        {wasEdited && (
          <Text style={styles.footerText}>Editada em {updatedAt}</Text>
        )}
        <Text style={styles.footerText}>
          {words} {words === 1 ? "palavra" : "palavras"}
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  // Header
  headerLoader: {
    marginRight: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAction: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  headerActionDisabled: {
    color: "#aeaeb2",
  },
  headerCancel: {
    fontSize: 17,
    color: "#0a7ea4",
    marginLeft: 4,
  },
  headerTrash: {
    marginLeft: 4,
  },
  headerTrashIcon: {
    fontSize: 18,
  },
  // Not found
  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
    backgroundColor: "#F5F5F7",
  },
  notFoundIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    textAlign: "center",
  },
  notFoundSubtitle: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#0a7ea4",
    borderRadius: 10,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  // View mode
  viewScroll: {
    padding: 20,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 16,
    lineHeight: 32,
  },
  viewBody: {
    fontSize: 16,
    color: "#3C3C43",
    lineHeight: 26,
    marginBottom: 32,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#9BA1A6",
  },
  // Edit mode
  editScroll: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  fieldWrap: {
    gap: 4,
  },
  fieldFlex: {
    flex: 1,
  },
  editTitleInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: "500",
    color: "#11181C",
  },
  editContentInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#11181C",
    lineHeight: 22,
    minHeight: 220,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginLeft: 4,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  counter: {
    fontSize: 12,
    color: "#9BA1A6",
    marginLeft: "auto",
  },
  counterWarn: {
    color: "#FF3B30",
    fontWeight: "600",
  },
  // Skeleton
  skeleton: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F7",
    gap: 12,
  },
});
