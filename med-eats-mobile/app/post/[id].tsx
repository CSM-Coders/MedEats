import { useLocalSearchParams, router } from "expo-router";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Pressable, 
  ScrollView, 
  ActivityIndicator, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/src/context/auth-context";
import { fetchPostById, fetchPostComments, addCommentApi, likePost, unlikePost } from "@/src/services/postApi";
import { Post, PostComment } from "@/src/models/domain";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getAccessToken, user: currentUser } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  const loadData = async () => {
    const token = await getAccessToken();
    if (!token || !id) return;

    try {
      const [postData, commentsData] = await Promise.all([
        fetchPostById(token, id),
        fetchPostComments(token, id),
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error("Error loading post detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleLike = async () => {
    const token = await getAccessToken();
    if (!token || !post || liking) return;

    setLiking(true);
    try {
      const updatedPost = post.isLiked 
        ? await unlikePost(token, post.id) 
        : await likePost(token, post.id);
      setPost(updatedPost);
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async () => {
    const token = await getAccessToken();
    if (!token || !id || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const comment = await addCommentApi(token, id, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment("");
      if (post) {
        setPost({ ...post, comments: post.comments + 1 });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Publicación no encontrada</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2D3436" />
          </Pressable>
          <Text style={styles.headerTitle}>Publicación</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              {/* User Row */}
              <Pressable 
                style={styles.userRow} 
                onPress={() => {
                  if (currentUser && currentUser.username === post.username) {
                    router.push("/profile");
                  } else {
                    router.push(`/user/${post.username}`);
                  }
                }}
              >
                <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
                <View>
                  <Text style={styles.username}>{post.username}</Text>
                  <Text style={styles.restaurantNameSmall}>{post.restaurantName}</Text>
                </View>
              </Pressable>

              {/* Post Image */}
              <Image source={{ uri: post.image }} style={styles.postImage} />

              {/* Actions */}
              <View style={styles.actionsRow}>
                <Pressable style={styles.actionButton} onPress={handleToggleLike}>
                  <Ionicons 
                    name={post.isLiked ? "heart" : "heart-outline"} 
                    size={28} 
                    color={post.isLiked ? "#E63946" : "#2D3436"} 
                  />
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={26} color="#2D3436" />
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Ionicons name="paper-plane-outline" size={26} color="#2D3436" />
                </Pressable>
              </View>

              {/* Likes & Caption */}
              <View style={styles.infoBlock}>
                <Text style={styles.likesText}>{post.likes} Me gusta</Text>
                <View style={styles.captionRow}>
                  <Text style={styles.captionUsername}>{post.username}</Text>
                  <Text style={styles.captionText}>{post.caption}</Text>
                </View>
                
                {/* Restaurant Badge */}
                <Pressable 
                  style={styles.restaurantBadge}
                  onPress={() => router.push(`/restaurant/${post.restaurantId}`)}
                >
                  <Text style={styles.restaurantBadgeText}>⭐ {post.rating} • {post.restaurantName}</Text>
                </Pressable>
                
                <Text style={styles.dateText}>{post.date}</Text>
              </View>

              <View style={styles.divider} />
              <Text style={styles.commentsTitle}>Comentarios</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentText}>
                  <Text style={styles.commentUsername}>{item.username}</Text> {item.content}
                </Text>
                <Text style={styles.commentDate}>{item.date}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>No hay comentarios aún. ¡Sé el primero!</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 70 }}
        />

        {/* Add Comment Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <Image 
            source={{ uri: currentUser?.avatarUrl || "https://ui-avatars.com/api/?name=" + currentUser?.username }} 
            style={styles.inputAvatar} 
          />
          <TextInput
            style={styles.textInput}
            placeholder="Añade un comentario..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Pressable 
            onPress={handleAddComment} 
            disabled={!newComment.trim() || submittingComment}
          >
            <Text style={[
              styles.postCommentButton,
              (!newComment.trim() || submittingComment) && { opacity: 0.5 }
            ]}>
              Publicar
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6" },
  username: { fontWeight: "700", color: "#2D3436", fontSize: 14 },
  restaurantNameSmall: { color: "#636E72", fontSize: 12 },
  postImage: { width: "100%", height: 400, backgroundColor: "#F3F4F6" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 16,
  },
  actionButton: { padding: 2 },
  infoBlock: { paddingHorizontal: 12, paddingBottom: 16 },
  likesText: { fontWeight: "700", color: "#2D3436", marginBottom: 6 },
  captionRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  captionUsername: { fontWeight: "700", color: "#2D3436", marginRight: 6 },
  captionText: { color: "#2D3436", lineHeight: 18 },
  restaurantBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF3EC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  restaurantBadgeText: { color: "#FF6B35", fontWeight: "700", fontSize: 12 },
  dateText: { color: "#B2BEC3", fontSize: 11, textTransform: "uppercase" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 12 },
  commentsTitle: { fontSize: 16, fontWeight: "700", color: "#2D3436", margin: 12 },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6" },
  commentContent: { flex: 1 },
  commentUsername: { fontWeight: "700", color: "#2D3436" },
  commentText: { color: "#2D3436", fontSize: 14, lineHeight: 18 },
  commentDate: { color: "#B2BEC3", fontSize: 11, marginTop: 4 },
  emptyComments: { padding: 20, alignItems: "center" },
  emptyCommentsText: { color: "#B2BEC3", textAlign: "center" },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  inputAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3F4F6" },
  textInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  postCommentButton: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 14,
  }
});
