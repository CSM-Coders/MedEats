// ============================================================
// TABS LAYOUT
// ------------------------------------------------------------
// Define las 4 secciones principales de la app para el usuario:
// Home, Feed, Create y Profile.
// ============================================================

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";

import { colors } from "@/src/theme/designTokens";

function TabIcon({
  name,
  color,
  size,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="feed/index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? "compass" : "compass-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create/index"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? "add-circle" : "add-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
});

