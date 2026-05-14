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
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color="#2D3436" />
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
                <Ionicons name="person" size={38} color="#FF6B35" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF4F0" },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2D3436",
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 4,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFD9CC",
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
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF4F0",
  },
  helperText: {
    marginTop: 8,
    color: "#636E72",
    fontSize: 12,
  },
  helperTextSmall: {
    color: "#8A8A8A",
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontWeight: "700",
    color: "#2D3436",
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FBFCFD",
    color: "#2D3436",
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  optionChipActive: {
    backgroundColor: "#FFF0EA",
    borderColor: "#FF6B35",
  },
  optionChipText: {
    color: "#636E72",
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: "#FF6B35",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    backgroundColor: "#FBFCFD",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#FFF0EA",
    borderColor: "#FF6B35",
  },
  toggleText: {
    color: "#636E72",
    fontWeight: "700",
  },
  toggleTextActive: {
    color: "#FF6B35",
  },
  saveButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
});
