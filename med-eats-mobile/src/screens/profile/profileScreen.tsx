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
import { useAuth } from "@/src/context/auth-context";
import { useFeed } from "@/src/context/feed-context";
import {
  fetchSavedRestaurants,
  fetchVisitedRestaurants,
} from "@/src/services/userCollectionsApi";

type TabType = "posts" | "saved" | "visited";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile, logout, getAccessToken } = useAuth();
  const { userPosts } = useFeed();
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurantRecord[]>([]);
  const [visitedRestaurants, setVisitedRestaurants] = useState<VisitedRestaurantRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadCollections = async () => {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          return;
        }

        try {
          await refreshProfile();
          const [saved, visited] = await Promise.all([
            fetchSavedRestaurants(accessToken),
            fetchVisitedRestaurants(accessToken),
          ]);

          setSavedRestaurants(saved);
          setVisitedRestaurants(visited);
        } catch {
          setSavedRestaurants([]);
          setVisitedRestaurants([]);
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
          <Pressable onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
            <Ionicons name="log-out-outline" size={20} color="#FF4757" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} bounces={true}>
        <View style={styles.profileBlock}>
          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
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
              <Ionicons name="location-outline" size={14} color="#636E72" />
              <Text style={styles.location}> {user.location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/edit-profile") }>
            <Text style={styles.secondaryButtonText}>Editar perfil</Text>
          </Pressable>
          {user.isRestaurantAccount ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/my-restaurant")}
            >
              <Text style={styles.secondaryButtonText}>Mi Restaurante</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Share Profile</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.tabsBar}>
          <Pressable 
            style={[styles.tabItem, activeTab === "posts" && styles.activeTab]}
            onPress={() => setActiveTab("posts")}
          >
            <Ionicons name="grid" size={22} color={activeTab === "posts" ? "#2D3436" : "#8C8C8C"} />
          </Pressable>
          <Pressable 
            style={[styles.tabItem, activeTab === "saved" && styles.activeTab]}
            onPress={() => setActiveTab("saved")}
          >
            <Ionicons name="bookmark-outline" size={22} color={activeTab === "saved" ? "#2D3436" : "#8C8C8C"} />
          </Pressable>
          <Pressable 
            style={[styles.tabItem, activeTab === "visited" && styles.activeTab]}
            onPress={() => setActiveTab("visited")}
          >
            <Ionicons name="person-outline" size={22} color={activeTab === "visited" ? "#2D3436" : "#8C8C8C"} />
          </Pressable>
        </View>

        {activeTab === "posts" ? (
          userPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>Start sharing your food experiences!</Text>
              <Pressable style={styles.ctaButton} onPress={() => router.push("/create")}> 
                <Text style={styles.ctaText}>Create your first post</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              key="profile-posts-grid"
              data={userPosts}
              numColumns={3}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.gridItem}
                  onPress={() => router.push(`/post/${item.id}`)}
                >
                  <Image source={{ uri: item.image }} style={styles.gridImage} />
                </Pressable>
              )}
            />
          )
        ) : activeTab === "saved" ? (
          <View style={styles.collectionSection}>
            {savedRestaurants.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="bookmark-outline" size={48} color="#B2BEC3" />
                <Text style={styles.emptyFeedText}>No saved restaurants yet</Text>
              </View>
            ) : (
              savedRestaurants.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.restaurantCard}
                  onPress={() => router.push(`/restaurant/${item.restaurant.id}`)}
                >
                  <Image source={{ uri: item.restaurant.image }} style={styles.restaurantImage} />
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurant.name}</Text>
                    <Text style={styles.restaurantMeta} numberOfLines={1}>{item.restaurant.category}</Text>
                  </View>
                  <Ionicons name="bookmark" size={20} color="#FF6B35" />
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <View style={styles.collectionSection}>
            {visitedRestaurants.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Ionicons name="restaurant-outline" size={48} color="#B2BEC3" />
                <Text style={styles.emptyFeedText}>No visited restaurants yet</Text>
              </View>
            ) : (
              visitedRestaurants.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.restaurantCard}
                  onPress={() => router.push(`/restaurant/${item.restaurant.id}`)}
                >
                  <Image source={{ uri: item.restaurant.image }} style={styles.restaurantImage} />
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurant.name}</Text>
                    <Text style={styles.restaurantMeta} numberOfLines={1}>My Rating: {item.rating} ★</Text>
                  </View>
                  <Ionicons name="restaurant" size={20} color="#2D3436" />
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#2D3436" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  logoutText: {
    color: "#FF4757",
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
    borderColor: "#E1E1E1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 40 },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#2D3436", fontSize: 32, fontWeight: "700" },
  statsRow: { flexDirection: "row", flex: 1, justifyContent: "space-around", marginLeft: 10 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#2D3436" },
  statLabel: { color: "#2D3436", fontSize: 13 },
  bioBlock: { paddingHorizontal: 16, paddingTop: 12 },
  name: { fontSize: 15, fontWeight: "700", color: "#2D3436" },
  metaLine: { color: "#8A8A8A", marginTop: 2, fontSize: 12 },
  bio: { color: "#2D3436", marginTop: 2, fontSize: 14, lineHeight: 18 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  location: { color: "#636E72", fontSize: 13 },
  actionsRow: { 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    marginTop: 18, 
    gap: 8 
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#2D3436", fontWeight: "700", fontSize: 14 },
  highlightsContainer: { marginTop: 20, paddingLeft: 16 },
  highlightsContent: { paddingRight: 32, gap: 18 },
  highlightItem: { alignItems: "center", gap: 6 },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF"
  },
  highlightImage: { width: "100%", height: "100%", borderRadius: 30 },
  highlightLabel: { fontSize: 12, color: "#2D3436", maxWidth: 70 },
  tabsBar: {
    flexDirection: "row",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  tabItem: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: "#2D3436",
  },
  collectionSection: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  restaurantCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#F8F9FA",
  },
  restaurantImage: { width: 58, height: 58, borderRadius: 12, backgroundColor: "#F3F4F6" },
  restaurantInfo: { flex: 1 },
  restaurantName: { fontSize: 14, fontWeight: "700", color: "#2D3436" },
  restaurantMeta: { fontSize: 12, color: "#636E72", marginTop: 2 },
  emptyState: { alignItems: "center", marginTop: 52, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#2D3436" },
  emptyText: { color: "#636E72", marginTop: 8, textAlign: "center" },
  emptyFeed: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 12,
  },
  emptyFeedText: { color: "#B2BEC3", fontSize: 16 },
  ctaButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700" },
  gridItem: { width: "33.333%", aspectRatio: 1, padding: 1 },
  gridImage: { width: "100%", height: "100%", backgroundColor: "#F3F4F6" },
});
