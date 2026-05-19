import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, spacing, radii } from "@/src/theme/designTokens";
import { fetchRestaurants } from "@/src/services/restaurantApi";
import { searchUsersWithAuth } from "@/src/services/userApi";
import { useAuth } from "@/src/context/auth-context";
import ProfileAvatar from "@/src/components/ProfileAvatar";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [restaurantResults, setRestaurantResults] = useState<any[]>([]);
  const { getAccessToken } = useAuth();

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 1) {
      setUserResults([]);
      setRestaurantResults([]);
      return;
    }

    setLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setUserResults([]);
        setRestaurantResults([]);
        return;
      }

      const [users, restaurants] = await Promise.all([
        searchUsersWithAuth(q, accessToken).catch(() => []),
        fetchRestaurants().catch(() => []),
      ]);

      // Filter users by username or name (from database)
      const filteredUsers = (users as any[]).filter((u: any) => 
        (u.username || u.name || "").toLowerCase().includes(q.toLowerCase())
      );

      // Filter restaurants by name (from database) - deduplicate by ID
      const uniqueRestaurantMap = new Map<string, any>();
      (restaurants as any[])
        .filter((r) => (r.name || "").toLowerCase().includes(q.toLowerCase()))
        .forEach((r) => {
          if (!uniqueRestaurantMap.has(r.id)) {
            uniqueRestaurantMap.set(r.id, r);
          }
        });

      // If a restaurant would also appear as a user result (e.g. owner username
      // or restaurant name equals a username/name), avoid showing it twice by
      // removing it from restaurants list. Prefer showing the user entry in that
      // case so the search is consistent with user-first results.
      const userKeys = new Set<string>(
        filteredUsers.flatMap((u: any) => [
          (u.username || "").toLowerCase(),
          (u.name || "").toLowerCase(),
        ])
      );

      const filteredRestaurantList = Array.from(uniqueRestaurantMap.values()).filter((r: any) => {
        const nameLower = (r.name || "").toLowerCase();
        const ownerLower = (r.ownerUsername || "").toLowerCase();
        // If the restaurant's name matches a user key or the owner username
        // matches a user, treat it as duplicate and skip showing the restaurant.
        if (userKeys.has(nameLower) || (ownerLower && userKeys.has(ownerLower))) {
          return false;
        }
        return true;
      });

      setUserResults(filteredUsers.slice(0, 50));
      setRestaurantResults(filteredRestaurantList.slice(0, 50));
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 220);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const renderUser = ({ item }: { item: any }) => (
    <Pressable style={styles.resultItem} onPress={() => router.push(`/user/${item.username}`)}>
      {item.avatarUrl ? (
        <ProfileAvatar uri={item.avatarUrl} size={44} />
      ) : (
        <ProfileAvatar uri={null} size={44} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.resultTitle}>{item.username}</Text>
        <Text style={styles.resultSubtitle}>{item.name}</Text>
      </View>
    </Pressable>
  );

  const renderRestaurant = ({ item }: { item: any }) => (
    <Pressable style={styles.resultItem} onPress={() => {
      // Si tiene ownerUsername, ir al perfil del dueño; si no, ir a detalles del restaurante
      if (item.ownerUsername) {
        router.push(`/user/${item.ownerUsername}`);
      } else {
        router.push(`/restaurant/${item.id}`);
      }
    }}>
      <ProfileAvatar uri={item.image} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle}>{item.location}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}> 
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Buscar usuarios o restaurantes"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={{ color: colors.primary }}>Cancelar</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={[...userResults.map((u) => ({ type: "user", data: u })), ...restaurantResults.map((r) => ({ type: "restaurant", data: r }))]}
          keyExtractor={(item, idx) => `${item.type}-${item.data.id ?? item.data.username}-${idx}`}
          renderItem={({ item }) => (item.type === "user" ? renderUser({ item: item.data }) : renderRestaurant({ item: item.data }))}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />}
          contentContainerStyle={{ padding: spacing.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, gap: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, paddingHorizontal: 12, height: 44, borderRadius: radii.md },
  input: { flex: 1, height: "100%", color: colors.text },
  cancelButton: { paddingHorizontal: 8 },
  resultItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  resultAvatar: { width: 44, height: 44, borderRadius: 10 },
  resultTitle: { fontWeight: "700", color: colors.text },
  resultSubtitle: { color: colors.textMuted, fontSize: 13 },
});
