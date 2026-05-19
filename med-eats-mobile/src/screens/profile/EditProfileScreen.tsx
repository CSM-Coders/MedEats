import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/auth-context";
import { updateMyProfile } from "@/src/services/authService";

import { colors, radii, spacing } from "@/src/theme/designTokens";

const GENDER_OPTIONS = [
  { value: "female", label: "Mujer" },
  { value: "male", label: "Hombre" },
  { value: "other", label: "Otro" },
  { value: "no_say", label: "Prefiero no decir" },
] as const;

type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, getAccessToken, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<GenderValue>("no_say");
  const [isPublic, setIsPublic] = useState(true);
  const [avatarFile, setAvatarFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setDisplayName(user.name || "");
    setUsername(user.username || "");
    setBio(user.bio || "");
    setGender(user.gender || "no_say");
    setIsPublic(user.isPublic ?? true);
    setAvatarPreview(user.avatarUrl || null);
    setAvatarFile(null);
  }, [user]);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    setAvatarPreview(asset.uri);
    setAvatarFile({
      uri: asset.uri,
      name: asset.fileName || `avatar-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
    });
  };

  const handleSave = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return;
    }

    if (!username.trim()) {
      Alert.alert("Usuario requerido", "El nombre de usuario no puede quedar vacío.");
      return;
    }

    setIsSaving(true);
    try {
      await updateMyProfile(accessToken, {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        gender,
        isPublic,
        avatarFile,
      });
      await refreshProfile();
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el perfil.";
      Alert.alert("Error", message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Editar perfil</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickPhoto} style={styles.avatarPressable}>
            {avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={38} color={colors.primary} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={colors.background} />
            </View>
          </Pressable>
          <Text style={styles.helperText}>Toca tu foto para cambiarla</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Tu nombre"
            style={styles.input}
          />

          <Text style={styles.label}>Usuario</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="tu_usuario"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Cuéntale al mundo quién eres"
            style={[styles.input, styles.textArea]}
            multiline
          />

          <Text style={styles.label}>Género</Text>
          <View style={styles.optionGrid}>
            {GENDER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setGender(option.value)}
                style={[
                  styles.optionChip,
                  gender === option.value && styles.optionChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    gender === option.value && styles.optionChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Privacidad</Text>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setIsPublic(true)}
              style={[styles.toggleButton, isPublic && styles.toggleButtonActive]}
            >
              <Text style={[styles.toggleText, isPublic && styles.toggleTextActive]}>Público</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsPublic(false)}
              style={[styles.toggleButton, !isPublic && styles.toggleButtonActive]}
            >
              <Text style={[styles.toggleText, !isPublic && styles.toggleTextActive]}>Privado</Text>
            </Pressable>
          </View>
          <Text style={styles.helperTextSmall}>
            En público cualquiera puede ver tu perfil; en privado solo tus seguidores.
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceAlt },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: spacing.xs,
  },
  avatarPressable: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surfaceAlt,
  },
  helperText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
  },
  helperTextSmall: {
    color: colors.textFaint,
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.input,
    color: colors.text,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
  },
  optionChipText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: colors.primary,
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  toggleButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
  },
  toggleText: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: colors.primary,
  },
  saveButton: {
    height: 50,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 16,
  },
});

