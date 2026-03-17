import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed } from "@/src/context/feed-context";
import { currentUser, getRestaurantById, visitedRestaurants } from "@/src/services/mockData";

type TabType = "posts" | "visited";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { userPosts } = useFeed();
  const [activeTab, setActiveTab] = useState<TabType>("posts");

  const visitedData = useMemo(
    () =>
      visitedRestaurants
        .map((item) => ({ ...item, restaurant: getRestaurantById(item.restaurantId) }))
        .filter((item) => item.restaurant),
    []
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <Text style={styles.headerTitle}>@{currentUser.username}</Text>
        <Ionicons name="settings-outline" size={22} color="#2D3436" />
      </View>

      <View style={styles.profileBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{currentUser.name.charAt(0)}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentUser.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentUser.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.bioBlock}>
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.bio}>{currentUser.bio}</Text>
        <Text style={styles.location}>📍 {currentUser.location}</Text>
      </View>

      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabButton, activeTab === "posts" && styles.tabButtonActive]}
          onPress={() => setActiveTab("posts")}
        >
          <Ionicons name="grid-outline" size={20} color={activeTab === "posts" ? "#FF6B35" : "#8C8C8C"} />
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === "visited" && styles.tabButtonActive]}
          onPress={() => setActiveTab("visited")}
        >
          <Ionicons
            name="location-outline"
            size={20}
            color={activeTab === "visited" ? "#FF6B35" : "#8C8C8C"}
          />
        </Pressable>
      </View>

      {activeTab === "posts" ? (
        userPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Create your first post to start sharing.</Text>
            <Pressable style={styles.ctaButton} onPress={() => router.push("/create")}> 
              <Text style={styles.ctaText}>Create Post</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={userPosts}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Image source={{ uri: item.image }} style={styles.gridImage} />
            )}
          />
        )
      ) : (
        <FlatList
          data={visitedData}
          keyExtractor={(item) => item.restaurantId}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            if (!item.restaurant) return null;

            return (
              <Pressable
                style={styles.visitedCard}
                onPress={() => router.push(`/restaurant/${item.restaurant?.id}`)}
              >
                <Image source={{ uri: item.restaurant.image }} style={styles.visitedImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.visitedName}>{item.restaurant.name}</Text>
                  <Text style={styles.visitedMeta}>Tu rating: {item.rating} ⭐</Text>
                  <Text style={styles.visitedMeta}>{item.visitDate}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#2D3436" },
  profileBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 18,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 34, fontWeight: "700" },
  statsRow: { flexDirection: "row", flex: 1, justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#2D3436" },
  statLabel: { color: "#636E72", fontSize: 12 },
  bioBlock: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  name: { fontWeight: "700", color: "#2D3436" },
  bio: { color: "#2D3436", marginTop: 4 },
  location: { color: "#636E72", marginTop: 4 },
  tabsRow: {
    marginTop: 10,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: "#FF6B35" },
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
  gridImage: { width: "33.333%", aspectRatio: 1, borderWidth: 0.5, borderColor: "#FFFFFF" },
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
