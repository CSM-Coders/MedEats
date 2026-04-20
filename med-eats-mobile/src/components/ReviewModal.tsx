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
              <Ionicons name="close" size={24} color="#636E72" />
            </Pressable>
          </View>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} onPress={() => setRating(i)}>
                <Ionicons
                  name={i <= rating ? "star" : "star-outline"}
                  size={40}
                  color={i <= rating ? "#FFB300" : "#B2BEC3"}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tu experiencia</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Cuéntanos qué te pareció la comida y el ambiente..."
              placeholderTextColor="#B2BEC3"
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
              <ActivityIndicator color="#FFF" />
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
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D3436",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    height: 120,
    color: "#2D3436",
    fontSize: 15,
  },
  errorText: {
    color: "#E63946",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#FF6B35",
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#B2BEC3",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
