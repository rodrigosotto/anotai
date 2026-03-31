import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function NewNoteScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">New Note</ThemedText>
      <ThemedText>O formulário de criação de nota aparecerá aqui.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
