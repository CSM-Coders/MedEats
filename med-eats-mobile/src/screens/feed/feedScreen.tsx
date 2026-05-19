// ============================================================
// FEED SCREEN
// ------------------------------------------------------------
// Muestra publicaciones sociales y permite interacción básica:
// - ver posts
// - dar/quitar like
// - abrir detalle del restaurante relacionado
// ============================================================

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback , useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed } from "@/src/context/feed-context";
import PostCommentModal from "@/src/components/PostCommentModal";
import { useAuth } from "@/src/context/auth-context";
import { colors, radii, spacing } from "@/src/theme/designTokens";

function stars(rating: number) {
  return [1, 2, 3, 4, 5].map((star) => (
    <Ionicons
      key={star}
      name={star <= Math.round(rating) ? "star" : "star-outline"}
      size={13}
      color={colors.primary}
    />
  ));
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { posts, toggleLike, isLoadingPosts, feedError, refreshPosts } = useFeed();
  const { user: currentUser } = useAuth();
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const handleUserPress = (username: string) => {
    if (currentUser && currentUser.username === username) {
      router.push("/profile");
    } else {
      router.push(`/user/${username}`);
    }
  };

  const openComments = (postId: string) => {
    setSelectedPostId(postId);
    setCommentModalVisible(true);
  };

  useFocusEffect(
    useCallback(() => {
      refreshPosts().catch(() => undefined);
    }, [refreshPosts])
  );

  if (isLoadingPosts) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.subtitle, { marginTop: spacing.sm }]}>Loading feed...</Text>
      </View>
    );
  }

  if (feedError) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl }]}> 
        <Text style={styles.title}>Feed unavailable</Text>
        <Text style={[styles.subtitle, { textAlign: "center", marginTop: spacing.sm }]}>{feedError}</Text>
        <Pressable style={[styles.restaurantBox, { marginTop: spacing.lg }]} onPress={() => refreshPosts()}>
          <Text style={styles.restaurantName}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }]}> 
        <View>
          <Text style={styles.title}>MedEats</Text>
          <Text style={styles.subtitle}>Discover food in Medellín</Text>
        </View>
        <Pressable style={styles.headerIcon} onPress={() => router.push("/search")}>
          <Ionicons name="search" size={22} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable 
              style={styles.userRow} 
              onPress={() => handleUserPress(item.username)}
            >
              {item.userAvatar ? (
                <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(item.username || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </Pressable>

            <Image source={{ uri: item.image }} style={styles.postImage} />

            <View style={styles.actionsRow}>
              <Pressable style={styles.actionButton} onPress={() => toggleLike(item.id)}>
                <Ionicons
                  name={item.isLiked ? "heart" : "heart-outline"}
                  size={22}
                  color={item.isLiked ? colors.primaryDark : colors.text}
                />
                <Text style={styles.actionText}>{item.likes}</Text>
              </Pressable>

              <Pressable style={styles.actionButton} onPress={() => openComments(item.id)}>
                <Ionicons name="chatbubble-outline" size={21} color={colors.text} />
                <Text style={styles.actionText}>{item.comments}</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.restaurantBox}
              onPress={() => router.push(`/restaurant/${item.restaurantId}`)}
            >
              <View>
                <Text style={styles.restaurantName}>{item.restaurantName}</Text>
                <View style={styles.starsRow}>{stars(item.rating)}</View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Text style={styles.caption}>
              <Text style={styles.username}>{item.username}</Text> {item.caption}
            </Text>
          </View>
        )}
      />

      {selectedPostId && (
        <PostCommentModal
          visible={commentModalVisible}
          postId={selectedPostId}
          onClose={() => setCommentModalVisible(false)}
          onCommentAdded={refreshPosts}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.text },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  subtitle: { color: colors.textMuted, marginTop: 2 },
  listContent: { paddingBottom: spacing.xxl },
  card: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md + 2,
    marginBottom: spacing.xs,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 14,
  },
  username: { fontWeight: "700", color: colors.text },
  date: { color: colors.textFaint, fontSize: 12 },
  postImage: { width: "100%", height: 330, backgroundColor: colors.chip },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { color: colors.text, fontWeight: "600" },
  restaurantBox: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  restaurantName: { fontWeight: "700", color: colors.text },
  starsRow: { flexDirection: "row", gap: 2, marginTop: 4 },
  caption: { paddingHorizontal: spacing.md, color: colors.text, fontSize: 14 },
});

