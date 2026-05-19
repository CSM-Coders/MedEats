import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing } from "@/src/theme/designTokens";

type ReviewModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  initialRating?: number;
  initialComment?: string;
  isEditing?: boolean;
};

export default function ReviewModal({
  visible,
  onClose,
  onSubmit,
  initialRating = 0,
  initialComment = "",
  isEditing = false,
}: ReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with props when modal opens for editing
  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setComment(initialComment);
      setError(null);
    }
  }, [visible, initialRating, initialComment]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Por favor selecciona una calificación.");
      return;
    }
    if (comment.trim().length < 5) {
      setError("El comentario debe tener al menos 5 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(rating, comment);
      onClose();
    } catch (err) {
      setError("Hubo un problema al guardar tu reseña.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? "Editar Reseña" : "Escribir una Reseña"}
            </Text>
            <Pressable onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setRating(i)}>
                <Ionicons
                  name={i <= rating ? "star" : "star-outline"}
                  size={40}
                  color={i <= rating ? colors.accent : colors.placeholder}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tu experiencia</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Cuéntanos qué te pareció la comida y el ambiente..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? "Guardar Cambios" : "Publicar Reseña"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm + 2,
  },
  textInput: {
    backgroundColor: colors.input,
    borderRadius: radii.md,
    padding: spacing.lg,
    height: 120,
    color: colors.text,
    fontSize: 15,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: colors.placeholder,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "700",
  },
});

