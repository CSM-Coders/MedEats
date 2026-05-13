import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, Image, Pressable, FlatList, ActivityIndicator, Dimensions, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/src/context/auth-context";
import { fetchUserProfileByUsername, followUser, unfollowUser } from "@/src/services/userApi";
import { fetchUserPosts } from "@/src/services/postApi";
import { AppUser, Post } from "@/src/models/domain";
import { router } from "expo-router";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const insets = useSafeAreaInsets();
  const { getAccessToken, user: currentUser } = useAuth();
  
  const [userProfile, setUserProfile] = useState<(AppUser & { isFollowing: boolean }) | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken || !username) return;

    try {
      setIsPrivateProfile(false);
      const [profileData, postsData] = await Promise.all([
        fetchUserProfileByUsername(accessToken, username),
        fetchUserPosts(accessToken, username),
      ]);
      setUserProfile(profileData);
      setUserPosts(postsData);
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : undefined;

      if (statusCode === 403) {
        setIsPrivateProfile(true);
        setUserProfile(null);
        setUserPosts([]);
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
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!userProfile) {
    if (isPrivateProfile) {
      return (
        <View style={styles.privateContainer}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2D3436" />
            </Pressable>
            <Text style={styles.headerTitle}>@{username}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.privateCard}>
            <Ionicons name="lock-closed-outline" size={42} color="#FF6B35" />
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </Pressable>
        <Text style={styles.headerTitle}>@{userProfile.username}</Text>
        <Ionicons name="notifications-outline" size={24} color="#2D3436" />
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
              <Ionicons name="location-outline" size={14} color="#636E72" />
              <Text style={styles.location}> {userProfile.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {!isMe ? (
            <>
              <Pressable 
                style={[
                  styles.primaryButton, 
                  userProfile.isFollowing && styles.secondaryButton
                ]} 
                onPress={handleFollowToggle}
                disabled={interactionLoading}
              >
                {interactionLoading ? (
                  <ActivityIndicator color={userProfile.isFollowing ? "#2D3436" : "#FFFFFF"} />
                ) : (
                  <Text style={[
                    styles.primaryButtonText,
                    userProfile.isFollowing && styles.secondaryButtonText
                  ]}>
                    {userProfile.isFollowing ? "Following" : "Follow"}
                  </Text>
                )}
              </Pressable>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Message</Text>
              </Pressable>
              <Pressable style={styles.iconButton}>
                <Ionicons name="person-add-outline" size={20} color="#2D3436" />
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.secondaryButton} onPress={() => router.push("/edit-profile")}>
              <Text style={styles.secondaryButtonText}>Editar perfil</Text>
            </Pressable>
          )}
        </View>

        {/* Tabs Bar */}
        <View style={styles.tabsBar}>
          <View style={[styles.tabItem, styles.activeTab]}>
            <Ionicons name="grid" size={24} color="#2D3436" />
          </View>
          <View style={styles.tabItem}>
            <Ionicons name="bookmark-outline" size={24} color="#636E72" />
          </View>
          <View style={styles.tabItem}>
            <Ionicons name="person-outline" size={24} color="#636E72" />
          </View>
        </View>

        {/* Grid de Posts */}
        <View style={styles.gridContainer}>
          {userPosts.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Ionicons name="images-outline" size={48} color="#B2BEC3" />
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
                  {/* Icon for carousel if we had multiple images */}
                  {/* <View style={styles.gridIcon}><Ionicons name="copy" size={16} color="white" /></View> */}
                </Pressable>
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const numColumns = 3;
const screenWidth = Dimensions.get("window").width;
const itemSize = screenWidth / numColumns;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#636E72", fontSize: 16 },
  privateContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  privateCard: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 48,
    borderRadius: 20,
    backgroundColor: "#FFF4F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  privateTitle: { fontSize: 22, fontWeight: "800", color: "#2D3436" },
  privateText: { color: "#636E72", textAlign: "center", lineHeight: 22 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#2D3436" },
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
  primaryButton: {
    flex: 1,
    backgroundColor: "#0095F6", // Instagram Blue
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#2D3436", fontWeight: "700", fontSize: 14 },
  iconButton: {
    width: 34,
    height: 34,
    backgroundColor: "#EFEFEF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
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
  emptyFeed: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 12,
  },
  emptyFeedText: { color: "#B2BEC3", fontSize: 16 },
  gridContainer: { flex: 1 },
  gridItem: { width: itemSize, height: itemSize, padding: 1 },
  gridImage: { flex: 1, backgroundColor: "#F3F4F6" },
});
