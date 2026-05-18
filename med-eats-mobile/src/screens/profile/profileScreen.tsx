// ============================================================
// PROFILE SCREEN
// ------------------------------------------------------------
// Resume la actividad del usuario:
// - estadísticas
// - grid de posts propios
// - restaurantes visitados
// ============================================================

import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Image, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SavedRestaurantRecord, VisitedRestaurantRecord } from "@/src/models/domain";
import { colors, radii } from "@/src/theme/designTokens";
import { useAuth } from "@/src/context/auth-context";
import { useFeed } from "@/src/context/feed-context";
import ProfileAvatar from "@/src/components/ProfileAvatar";
import {
  fetchSavedRestaurants,
  fetchVisitedRestaurants,
} from "@/src/services/userCollectionsApi";
import { fetchFollowRequests } from "@/src/services/userApi";

type TabType = "posts" | "saved" | "visited";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile, logout, getAccessToken } = useAuth();
  const { userPosts } = useFeed();
  const isRestaurantAccount = user?.isRestaurantAccount || user?.accountType === "restaurant";
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurantRecord[]>([]);
  const [visitedRestaurants, setVisitedRestaurants] = useState<VisitedRestaurantRecord[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      const loadCollections = async () => {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          return;
        }

        try {
          await refreshProfile();
          const [saved, visited, requests] = await Promise.all([
            fetchSavedRestaurants(accessToken),
            fetchVisitedRestaurants(accessToken),
            fetchFollowRequests(accessToken).catch(() => []),
          ]);

          setSavedRestaurants(saved);
          setVisitedRestaurants(visited);
          setPendingRequestsCount(requests.length);
        } catch {
          setSavedRestaurants([]);
          setVisitedRestaurants([]);
          setPendingRequestsCount(0);
        }
      };

      loadCollections().catch(() => undefined);
    }, [getAccessToken, refreshProfile])
  );

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <Text style={styles.headerTitle}>@{user.username}</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push("/notifications" as any)} style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {pendingRequestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} bounces={true}>
        <View style={styles.profileBlock}>
          <View style={styles.avatarContainer}>
            <ProfileAvatar uri={user.avatarUrl} size={80} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.followers}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.following}</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioBlock}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.metaLine}>
            {user.gender === "male"
              ? "Hombre"
              : user.gender === "female"
              ? "Mujer"
              : user.gender === "other"
              ? "Otro"
              : "Prefiere no decir"}
            · {user.isPublic === false ? "Perfil privado" : "Perfil público"}
          </Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          {user.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.location}> {user.location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push(isRestaurantAccount ? "/my-restaurant" : "/edit-profile")}
          >
            <Text style={styles.secondaryButtonText}>
              {isRestaurantAccount ? "Mi restaurante" : "Editar perfil"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.tabsBar}>
          <Pressable style={[styles.tabItem, activeTab === "posts" && styles.activeTab]} onPress={() => setActiveTab("posts")}>
            <Ionicons name="grid" size={24} color={colors.text} />
          </Pressable>
          <Pressable style={[styles.tabItem, activeTab === "saved" && styles.activeTab]} onPress={() => setActiveTab("saved")}>
            <Ionicons name="bookmark-outline" size={24} color={colors.textMuted} />
          </Pressable>
          <Pressable style={[styles.tabItem, activeTab === "visited" && styles.activeTab]} onPress={() => setActiveTab("visited")}>
            <Ionicons name="person-outline" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {activeTab === "posts" && (
          <View style={styles.gridContainer}>
            {userPosts.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="images-outline" size={48} color={colors.placeholder} />
                <Text style={styles.emptyFeedText}>Aún no hay posts</Text>
              </View>
            ) : (
              <FlatList
                data={userPosts}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.gridItem}
                    onPress={() => router.push(`/post/${item.id}`)}
                  >
                    <Image source={{ uri: item.image }} style={styles.gridImage} />
                  </Pressable>
                )}
              />
            )}
          </View>
        )}

        {activeTab === "saved" && (
          <View style={styles.collectionSection}>
            {savedRestaurants.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="bookmark-outline" size={48} color={colors.placeholder} />
                <Text style={styles.emptyFeedText}>No hay restaurantes guardados</Text>
              </View>
            ) : (
              savedRestaurants.map((record) => {
                const restaurant = record.restaurant;
                if (!restaurant) return null;

                return (
                  <Pressable
                    key={record.id}
                    style={styles.restaurantCard}
                    onPress={() => router.push(`/restaurant/${restaurant.id}`)}
                  >
                    <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
                    <View style={styles.restaurantInfo}>
                      <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
                      <Text style={styles.restaurantMeta} numberOfLines={1}>{restaurant.category}</Text>
                    </View>
                    <Ionicons name="bookmark" size={20} color={colors.primary} />
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {activeTab === "visited" && (
          <View style={styles.collectionSection}>
            {visitedRestaurants.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="restaurant-outline" size={48} color={colors.placeholder} />
                <Text style={styles.emptyFeedText}>No hay restaurantes visitados</Text>
              </View>
            ) : (
              visitedRestaurants.map((record) => {
                const restaurant = record.restaurant;
                if (!restaurant) return null;

                return (
                  <Pressable
                    key={record.id}
                    style={styles.restaurantCard}
                    onPress={() => router.push(`/restaurant/${restaurant.id}`)}
                  >
                    <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
                    <View style={styles.restaurantInfo}>
                      <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
                      <Text style={styles.restaurantMeta} numberOfLines={1}>
                        {restaurant.category} · {record.rating}★
                      </Text>
                    </View>
                    <Ionicons name="restaurant" size={20} color={colors.text} />
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const itemSize = 100; // Define or calculate item size for grid

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellButton: {
    padding: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.background,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    gap: 6,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 13,
  },
  profileBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: "space-between",
  },
  avatarContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 40 },
  statsRow: { flexDirection: "row", flex: 1, justifyContent: "space-around", marginLeft: 10 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  statLabel: { color: colors.text, fontSize: 13 },
  bioBlock: { paddingHorizontal: 16, paddingTop: 12 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  metaLine: { color: colors.textFaint, marginTop: 2, fontSize: 12 },
  bio: { color: colors.text, marginTop: 2, fontSize: 14, lineHeight: 18 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  location: { color: colors.textMuted, fontSize: 13 },
  actionsRow: { 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    marginTop: 18, 
    gap: 8 
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.chip,
    height: 34,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  highlightsContainer: { marginTop: 20, paddingLeft: 16 },
  highlightsContent: { paddingRight: 32, gap: 18 },
  highlightItem: { alignItems: "center", gap: 6 },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  highlightImage: { width: "100%", height: "100%", borderRadius: 30 },
  highlightLabel: { fontSize: 12, color: colors.text, maxWidth: 70 },
  tabsBar: {
    flexDirection: "row",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  collectionSection: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  restaurantImage: { width: 58, height: 58, borderRadius: 12, backgroundColor: colors.chip },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 14, fontWeight: "700", color: colors.text },
  restaurantMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  emptyFeed: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 12,
  },
  emptyFeedText: { color: colors.placeholder, fontSize: 16 },
  gridContainer: { flex: 1 },
  gridItem: { width: "33.333%", aspectRatio: 1, padding: 1 },
  gridImage: { flex: 1, backgroundColor: colors.chip },
});

