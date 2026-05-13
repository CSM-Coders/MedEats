// ============================================================
// CREATE POST SCREEN
// ------------------------------------------------------------
// Flujo de publicación:
// 1) elegir imagen
// 2) seleccionar restaurante
// 3) calificar
// 4) escribir caption
// 5) publicar en el feed (estado global)
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Restaurant } from "@/src/models/domain";
import { useFeed } from "@/src/context/feed-context";
import { fetchRestaurants } from "@/src/services/restaurantApi";
import * as ImagePicker from "expo-image-picker";

// We won't use sample images anymore

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const { createPost } = useFeed();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [rating, setRating] = useState(0);
  const [caption, setCaption] = useState("");
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === restaurantId),
    [restaurants, restaurantId]
  );
  
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;
    return restaurants.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [restaurants, searchQuery]);

  const resetForm = () => {
    setSelectedImage(null);
    setRestaurantId("");
    setRating(0);
    setCaption("");
    setShowRestaurantSelector(false);
    setSearchQuery("");
  };

  const pickMedia = async () => {
    // Solicitar abrir galería
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants();
        setRestaurants(data);
      } catch {
        Alert.alert("Error", "Unable to load restaurants.");
      } finally {
        setIsLoadingRestaurants(false);
      }
    };

    loadRestaurants();
  }, []);

  const canPublish = Boolean(selectedImage && restaurantId && rating > 0 && caption.trim());

  const handlePublish = async () => {
    if (!canPublish || !selectedImage) {
      Alert.alert("Campos incompletos", "Completa todos los campos antes de publicar.");
      return;
    }

    try {
      await createPost({
        restaurantId,
        rating,
        caption: caption.trim(),
        image: selectedImage,
      });

      resetForm();
      Alert.alert("Post publicado", "Tu experiencia se publicó y el formulario se limpió.");
    } catch {
      Alert.alert("Error", "No se pudo publicar tu post.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <Text style={styles.title}>Create Post</Text>
        <Text style={styles.subtitle}>Share your food experience</Text>
      </View>

      <Text style={styles.label}>Upload Photo</Text>
      {selectedImage ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
          <Pressable style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.uploadBox}
          onPress={pickMedia}
        >
          <Ionicons name="images-outline" size={34} color="#FF6B35" />
          <Text style={styles.uploadText}>Subir foto o video</Text>
        </Pressable>
      )}

      <Text style={styles.label}>Restaurant</Text>
      <Pressable
        style={styles.selectorButton}
        disabled={isLoadingRestaurants}
        onPress={() => setShowRestaurantSelector((value) => !value)}
      >
        <Text style={styles.selectorText}>
          {selectedRestaurant
            ? selectedRestaurant.name
            : isLoadingRestaurants
            ? "Loading restaurants..."
            : "Choose a restaurant"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#636E72" />
      </Pressable>

      {showRestaurantSelector && (
        <View style={styles.selectorPanel}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#B2BEC3" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar restaurante..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
            {filteredRestaurants.length === 0 ? (
                <Text style={styles.noResultsText}>No se encontraron restaurantes</Text>
            ) : (
                filteredRestaurants.map((restaurant) => (
                  <Pressable
                    key={restaurant.id}
                    style={styles.selectorItem}
                    onPress={() => {
                      setRestaurantId(restaurant.id);
                      setShowRestaurantSelector(false);
                      setSearchQuery(""); // clear search on select
                    }}
                  >
              <Image source={{ uri: restaurant.image }} style={styles.selectorImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectorItemTitle}>{restaurant.name}</Text>
                <Text style={styles.selectorItemSubtitle}>{restaurant.category}</Text>
              </View>
                  </Pressable>
                ))
            )}
          </ScrollView>
        </View>
      )}

      <Text style={styles.label}>Rating</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={36}
              color="#FF6B35"
            />
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Caption</Text>
      <TextInput
        style={styles.captionInput}
        multiline
        value={caption}
        onChangeText={setCaption}
        placeholder="What did you like?"
      />

      <Pressable
        style={[styles.publishButton, !canPublish && styles.publishButtonDisabled]}
        onPress={handlePublish}
      >
        <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
        <Text style={styles.publishText}>Publish</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#2D3436" },
  subtitle: { color: "#636E72" },
  label: { fontWeight: "700", color: "#2D3436", marginBottom: 8, marginTop: 12 },
  imageWrapper: { borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", height: 260 },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBox: {
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DFE6E9",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: { color: "#636E72" },
  selectorButton: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: { color: "#2D3436", fontWeight: "500" },
  selectorPanel: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DFE6E9",
    backgroundColor: "#F8F9FA",
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 8,
    fontSize: 15,
  },
  noResultsText: {
    padding: 16,
    color: "#636E72",
    textAlign: "center",
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
  },
  selectorImage: { width: 44, height: 44, borderRadius: 10 },
  selectorItemTitle: { fontWeight: "600", color: "#2D3436" },
  selectorItemSubtitle: { fontSize: 12, color: "#636E72" },
  starsRow: { flexDirection: "row", gap: 6 },
  captionInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  publishButton: {
    marginTop: 18,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  publishButtonDisabled: { opacity: 0.6 },
  publishText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
