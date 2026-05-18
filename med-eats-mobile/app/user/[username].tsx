import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, Image, Pressable, FlatList, ActivityIndicator, Dimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/src/context/auth-context";
import { fetchUserProfileByUsername, followUser, unfollowUser } from "@/src/services/userApi";
import { fetchUserPosts } from "@/src/services/postApi";
import {
  fetchSavedRestaurants,
  fetchVisitedRestaurants,
} from "../../src/services/userCollectionsApi";
import { AppUser, Post, SavedRestaurantRecord, VisitedRestaurantRecord } from "../../src/models/domain";
import { colors, radii } from "../../src/theme/designTokens";
import { router } from "expo-router";

type TabType = "posts" | "saved" | "visited";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const insets = useSafeAreaInsets();
  const { getAccessToken, user: currentUser } = useAuth();
  
  const [userProfile, setUserProfile] = useState<(AppUser & { isFollowing: boolean }) | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedRestaurants, setSavedRestaurants] = useState<SavedRestaurantRecord[]>([]);
  const [visitedRestaurants, setVisitedRestaurants] = useState<VisitedRestaurantRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [loading, setLoading] = useState(true);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken || !username) return;

    try {
      setIsPrivateProfile(false);
      const [profileData, postsData, savedData, visitedData] = await Promise.all([
        fetchUserProfileByUsername(accessToken, username),
        fetchUserPosts(accessToken, username),
        fetchSavedRestaurants(accessToken, username),
        fetchVisitedRestaurants(accessToken, username),
      ]);
      setUserProfile(profileData);
      setUserPosts(postsData);
      setSavedRestaurants(savedData);
      setVisitedRestaurants(visitedData);
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : undefined;

      if (statusCode === 403) {
        setIsPrivateProfile(true);
        setUserProfile(null);
        setUserPosts([]);
        setSavedRestaurants([]);
        setVisitedRestaurants([]);
      }

      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken || !userProfile || interactionLoading) return;

    setInteractionLoading(true);
    try {
      if (userProfile.isFollowing) {
        await unfollowUser(accessToken, userProfile.username);
      } else {
        await followUser(accessToken, userProfile.username);
      }
      // Refresh local state
      await loadProfile();
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setInteractionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!userProfile) {
    if (isPrivateProfile) {
      return (
        <View style={styles.privateContainer}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>@{username}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.privateCard}>
            <Ionicons name="lock-closed-outline" size={42} color={colors.primary} />
            <Text style={styles.privateTitle}>Perfil privado</Text>
            <Text style={styles.privateText}>
              La cuenta de @{username} es privada. Sigue la cuenta para ver sus posts y actividad.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Usuario no encontrado</Text>
      </View>
    );
  }

  const isMe = currentUser?.username === userProfile.username;
  const isRestaurantAccount = currentUser?.isRestaurantAccount || currentUser?.accountType === "restaurant";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>@{userProfile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} bounces={true}>
        {/* Profile Info */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarContainer}>
            {userProfile.avatarUrl ? (
              <Image source={{ uri: userProfile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{userProfile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.posts}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.followers}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile.following}</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioBlock}>
          <Text style={styles.name}>{userProfile.name}</Text>
          {userProfile.bio ? <Text style={styles.bio}>{userProfile.bio}</Text> : null}
          {userProfile.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.location}> {userProfile.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {!isMe ? (
            <Pressable 
              style={[
                styles.primaryButton, 
                userProfile.isFollowing && styles.secondaryButton
              ]} 
              onPress={handleFollowToggle}
              disabled={interactionLoading}
            >
              {interactionLoading ? (
                <ActivityIndicator color={userProfile.isFollowing ? colors.text : colors.background} />
              ) : (
                <Text style={[
                  styles.primaryButtonText,
                  userProfile.isFollowing && styles.secondaryButtonText
                ]}>
                  {userProfile.isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push(isRestaurantAccount ? "/my-restaurant" : "/edit-profile")}
            >
              <Text style={styles.secondaryButtonText}>
                {isRestaurantAccount ? "Mi restaurante" : "Editar perfil"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Tabs Bar */}
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
                <Text style={styles.emptyFeedText}>No posts yet</Text>
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
                <Text style={styles.emptyFeedText}>No saved restaurants yet</Text>
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
                <Text style={styles.emptyFeedText}>No visited restaurants yet</Text>
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

const numColumns = 3;
const screenWidth = Dimensions.get("window").width;
const itemSize = screenWidth / numColumns;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: colors.textMuted, fontSize: 16 },
  privateContainer: { flex: 1, backgroundColor: colors.background },
  privateCard: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 48,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  privateTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  privateText: { color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
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
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontSize: 32, fontWeight: "700" },
  statsRow: { flexDirection: "row", flex: 1, justifyContent: "space-around", marginLeft: 10 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  statLabel: { color: colors.text, fontSize: 13 },
  bioBlock: { paddingHorizontal: 16, paddingTop: 12 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  bio: { color: colors.text, marginTop: 2, fontSize: 14, lineHeight: 18 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  location: { color: colors.textMuted, fontSize: 13 },
  actionsRow: { 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    marginTop: 18, 
    gap: 8 
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 34,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: colors.background, fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.chip,
    height: 34,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  iconButton: {
    width: 34,
    height: 34,
    backgroundColor: colors.chip,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
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
  gridItem: { width: itemSize, height: itemSize, padding: 1 },
  gridImage: { flex: 1, backgroundColor: colors.chip },
});
