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
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadCollections = async () => {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          return;
        }

        setCollectionsLoading(true);
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
        } finally {
          setCollectionsLoading(false);
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
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          {user.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#636E72" />
              <Text style={styles.location}> {user.location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/profile")}>
            <Text style={styles.secondaryButtonText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Share Profile</Text>
          </Pressable>
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
          <FlatList
            key="profile-saved-list"
            data={savedRestaurants}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No saved restaurants yet.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.visitedCard}
                onPress={() => router.push(`/restaurant/${item.restaurant.id}`)}
              >
                <Image source={{ uri: item.restaurant.image }} style={styles.visitedImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitedName}>{item.restaurant.name}</Text>
                  <Text style={styles.visitedMeta}>{item.restaurant.category}</Text>
                </View>
              </Pressable>
            )}
          />
        ) : (
          <FlatList
            key="profile-visited-list"
            data={visitedRestaurants}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No visited restaurants yet.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.visitedCard}
                onPress={() => router.push(`/restaurant/${item.restaurant.id}`)}
              >
                <Image source={{ uri: item.restaurant.image }} style={styles.visitedImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitedName}>{item.restaurant.name}</Text>
                  <Text style={styles.visitedMeta}>My Rating: {item.rating} ⭐</Text>
                </View>
              </Pressable>
            )}
          />
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
  emptyState: { alignItems: "center", marginTop: 52, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#2D3436" },
  emptyText: { color: "#636E72", marginTop: 8, textAlign: "center" },
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
  visitedCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  visitedImage: { width: 64, height: 64, borderRadius: 10 },
  visitedName: { fontWeight: "700", color: "#2D3436" },
  visitedMeta: { color: "#636E72", fontSize: 12, marginTop: 2 },
});
