import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Notes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="note.text" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: "New Note",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="square.and.pencil" color={color} />
          ),
        }}
      />
      {/* Oculta a tela explore do tab bar; pode ser removida do projeto */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
