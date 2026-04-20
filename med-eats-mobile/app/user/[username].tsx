import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, Image, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/src/context/auth-context";
import { fetchUserProfileByUsername, followUser, unfollowUser } from "@/src/services/userApi";
import { AppUser } from "@/src/models/domain";
import { router } from "expo-router";

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const insets = useSafeAreaInsets();
  const { getAccessToken, user: currentUser } = useAuth();
  
  const [userProfile, setUserProfile] = useState<(AppUser & { isFollowing: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactionLoading, setInteractionLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken || !username) return;

    try {
      const data = await fetchUserProfileByUsername(accessToken, username);
      setUserProfile(data);
    } catch (error) {
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
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Info */}
      <View style={styles.profileBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userProfile.name.charAt(0)}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.followers}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.following}</Text>
            <Text style={styles.statLabel}>Seguidos</Text>
          </View>
        </View>
      </View>

      <View style={styles.bioBlock}>
        <Text style={styles.name}>{userProfile.name}</Text>
        {userProfile.bio ? <Text style={styles.bio}>{userProfile.bio}</Text> : null}
        {userProfile.location ? <Text style={styles.location}>📍 {userProfile.location}</Text> : null}
      </View>

      {/* Action Buttons */}
      {!isMe && (
        <View style={styles.actionsRow}>
          <Pressable 
            style={[
              styles.followButton, 
              userProfile.isFollowing && styles.unfollowButton
            ]} 
            onPress={handleFollowToggle}
            disabled={interactionLoading}
          >
            {interactionLoading ? (
              <ActivityIndicator color={userProfile.isFollowing ? "#2D3436" : "#FFFFFF"} />
            ) : (
              <Text style={[
                styles.followButtonText,
                userProfile.isFollowing && styles.unfollowButtonText
              ]}>
                {userProfile.isFollowing ? "Dejar de seguir" : "Seguir"}
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Feed placeholder - In the future we will list the user's posts here */}
      <View style={styles.emptyFeed}>
        <Ionicons name="images-outline" size={48} color="#B2BEC3" />
        <Text style={styles.emptyFeedText}>Próximamente: Lista de posts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#636E72", fontSize: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { padding: 4 },
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
  name: { fontSize: 18, fontWeight: "800", color: "#2D3436" },
  bio: { color: "#2D3436", marginTop: 4, lineHeight: 20 },
  location: { color: "#636E72", marginTop: 4 },
  actionsRow: { paddingHorizontal: 16, marginTop: 16 },
  followButton: {
    backgroundColor: "#FF6B35",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unfollowButton: {
    backgroundColor: "#F3F4F6",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  unfollowButtonText: {
    color: "#2D3436",
  },
  emptyFeed: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    gap: 12,
  },
  emptyFeedText: {
    color: "#B2BEC3",
    fontSize: 16,
  }
});
