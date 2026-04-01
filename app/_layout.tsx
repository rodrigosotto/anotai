import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  useEffect,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { runMigrations } from "@/src/db/migrations";
import { ToastProvider } from "@/src/context/ToastContext";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

// ─── Loading fallback ─────────────────────────────────────────────────────────

function LoadingFallback() {
  return (
    <View style={rootStyles.loading}>
      <ActivityIndicator size="large" />
    </View>
  );
}

// ─── Error boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção, enviar para serviço de monitoramento (ex: Sentry)
    if (__DEV__) {
      console.error("[AppErrorBoundary]", error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={rootStyles.errorContainer}>
          <Text style={rootStyles.errorIcon}>💥</Text>
          <Text style={rootStyles.errorTitle}>Algo deu errado</Text>
          <Text style={rootStyles.errorMessage}>
            {__DEV__
              ? (this.state.error?.message ?? "Erro desconhecido")
              : "Ocorreu um erro inesperado. Por favor, tente novamente."}
          </Text>
          <TouchableOpacity
            style={rootStyles.errorBtn}
            onPress={this.handleReset}
            accessibilityRole="button"
          >
            <Text style={rootStyles.errorBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Root layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={rootStyles.flex}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <ToastProvider>
            <Suspense fallback={<LoadingFallback />}>
              <SQLiteProvider
                databaseName="notes.db"
                onInit={runMigrations}
                useSuspense
              >
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="note/[id]"
                    options={{ title: "Nota", headerBackTitle: "Voltar" }}
                  />
                </Stack>
                <StatusBar style="auto" />
              </SQLiteProvider>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const rootStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#F5F5F7",
    gap: 12,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#11181C",
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  errorBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
  },
  errorBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
