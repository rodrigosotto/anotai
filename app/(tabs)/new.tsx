import { zodResolver } from "@hookform/resolvers/zod";
import { router, useNavigation } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewNoteScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const repo = useNoteRepository();
  const contentRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState, watch, getValues, reset } =
    useForm<NoteFormValues>({
      resolver: zodResolver(noteSchema),
      defaultValues: { title: "", content: "" },
      mode: "onChange",
    });

  const contentLength = (watch("content") ?? "").length;
  const isNearLimit = contentLength > 9_500;

  const isDirtyRef = useRef(false);
  useEffect(() => {
    isDirtyRef.current = formState.isDirty;
  });

  const [isSaving, setIsSaving] = useState(false);

  // ── Save handlers ──────────────────────────────────────────────────────────

  const doSave = useCallback(
    async (values: NoteFormValues) => {
      setIsSaving(true);
      try {
        await repo.createNote(values);
        reset();
        router.replace("/(tabs)");
      } catch {
        Alert.alert("Erro", "Não foi possível salvar a nota. Tente novamente.");
      } finally {
        setIsSaving(false);
      }
    },
    [repo, reset],
  );

  const doSaveDraft = useCallback(async () => {
    const { title, content } = getValues();
    setIsSaving(true);
    try {
      await repo.createNote({
        title: title.trim() || "[Rascunho]",
        content: content.trim(),
      });
      reset();
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o rascunho.");
    } finally {
      setIsSaving(false);
    }
  }, [repo, getValues, reset]);

  const submitForm = useCallback(() => {
    handleSubmit(doSave)();
  }, [handleSubmit, doSave]);

  // ── Unsaved changes guard ──────────────────────────────────────────────────

  const showUnsavedAlert = useCallback(
    (onDiscard: () => void) => {
      Alert.alert(
        "Nota não salva",
        "Você tem alterações não salvas. O que deseja fazer?",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              reset();
              onDiscard();
            },
          },
          { text: "Salvar rascunho", onPress: doSaveDraft },
        ],
      );
    },
    [doSaveDraft, reset],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!isDirtyRef.current) return false;
      showUnsavedAlert(() => router.back());
      return true;
    });
    return () => sub.remove();
  }, [showUnsavedAlert]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      showUnsavedAlert(() => navigation.dispatch(e.data.action));
    });
    return unsub;
  }, [navigation, showUnsavedAlert]);

  // ── Header buttons ─────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    const submitting = isSaving || formState.isSubmitting;
    navigation.setOptions({
      title: "Nova Nota",
      headerRight: () =>
        submitting ? (
          <ActivityIndicator size="small" style={styles.headerLoader} />
        ) : (
          <TouchableOpacity
            onPress={submitForm}
            disabled={!formState.isValid || submitting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Salvar nota"
          >
            <Text
              style={[
                styles.headerSave,
                (!formState.isValid || submitting) && styles.headerSaveDisabled,
              ]}
            >
              Salvar
            </Text>
          </TouchableOpacity>
        ),
    });
  }, [
    navigation,
    formState.isValid,
    formState.isSubmitting,
    isSaving,
    submitForm,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title field */}
        <Controller
          control={control}
          name="title"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <View style={styles.fieldWrap}>
              <TextInput
                style={[styles.titleInput, !!error && styles.inputError]}
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

        {/* Content field */}
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
                style={[styles.contentInput, !!error && styles.inputError]}
                placeholder="Escreva sua nota aqui…"
                placeholderTextColor="#9BA1A6"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Conteúdo da nota"
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  scroll: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  headerLoader: {
    marginRight: 8,
  },
  headerSave: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0a7ea4",
    marginRight: 4,
  },
  headerSaveDisabled: {
    color: "#aeaeb2",
  },
  fieldWrap: {
    gap: 4,
  },
  fieldFlex: {
    flex: 1,
  },
  titleInput: {
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
  contentInput: {
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
});
