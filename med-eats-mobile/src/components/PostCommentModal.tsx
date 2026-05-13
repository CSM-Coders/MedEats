import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchPostComments, addCommentApi } from "@/src/services/postApi";
import { PostComment } from "@/src/models/domain";
import { useAuth } from "@/src/context/auth-context";
import { colors, radii } from "@/src/theme/designTokens";

type PostCommentModalProps = {
  visible: boolean;
  postId: string;
  onClose: () => void;
  onCommentAdded: () => void;
};

export default function PostCommentModal({
  visible,
  postId,
  onClose,
  onCommentAdded,
}: PostCommentModalProps) {
  const { getAccessToken } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setLoading(true);
    try {
      const data = await fetchPostComments(accessToken, postId);
      setComments(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, postId]);

  useEffect(() => {
    if (visible) {
      loadComments();
    }
  }, [visible, loadComments]);

  const handleSubmit = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await addCommentApi(accessToken, postId, newComment.trim());
      setNewComment("");
      await loadComments();
      onCommentAdded(); // To update count in feed
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContent}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Comentarios</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.commentCard}>
                  <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
                  <View style={styles.commentTextContainer}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                    <Text style={styles.date}>{item.date}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay comentarios aún. ¡Sé el primero!</Text>
                </View>
              }
            />
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe un comentario aquí"
              placeholderTextColor="rgba(45,52,54,0.35)"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable
              style={[styles.sendButton, !newComment.trim() && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  commentCard: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chip,
  },
  commentTextContainer: {
    flex: 1,
  },
  username: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 14,
  },
  commentContent: {
    color: colors.text,
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  date: {
    color: colors.placeholder,
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === "ios" ? 32 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: colors.text,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: colors.placeholder,
  },
});
