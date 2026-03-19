// ============================================================
// RESTAURANT DETAIL SCREEN
// ------------------------------------------------------------
// Vista completa de un restaurante seleccionado:
// - imagen principal
// - información general
// - highlights del menú
// - reseñas
// - contacto por WhatsApp
// ============================================================

import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Restaurant } from "@/src/models/domain";
import { getReviewsByRestaurantId } from "@/src/services/mockData";

type Props = {
  restaurant: Restaurant;
};

export default function RestaurantDetailScreen({ restaurant }: Props) {
  const insets = useSafeAreaInsets();
  const reviews = getReviewsByRestaurantId(restaurant.id);

  const openWhatsapp = () => {
    const url = `https://wa.me/${restaurant.whatsapp}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={[styles.headerRow, { top: insets.top + 8 }]}> 
        <Pressable style={styles.roundButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#2D3436" />
        </Pressable>
      </View>

      <Image source={{ uri: restaurant.image }} style={styles.hero} />

      <View style={styles.content}>
        <Text style={styles.title}>{restaurant.name}</Text>
        <Text style={styles.subtitle}>{restaurant.category}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>⭐ {restaurant.rating}</Text>
          <Text style={styles.metaText}>📍 {restaurant.location}</Text>
        </View>

        <Text style={styles.description}>{restaurant.description}</Text>

        <Text style={styles.sectionTitle}>Menu highlights</Text>
        {restaurant.menuHighlights.map((item) => (
          <Text key={item} style={styles.menuItem}>• {item}</Text>
        ))}

        <Pressable style={styles.whatsappButton} onPress={openWhatsapp}>
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.whatsappText}>Contact by WhatsApp</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.emptyReview}>No reviews yet.</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                <View>
                  <Text style={styles.reviewUser}>{review.username}</Text>
                  <Text style={styles.reviewMeta}>⭐ {review.rating} · {review.date}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerRow: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  hero: { width: "100%", height: 250 },
  content: { padding: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#2D3436" },
  subtitle: { color: "#636E72", marginTop: 4 },
  metaRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  metaText: { color: "#2D3436", fontWeight: "500" },
  description: { marginTop: 12, color: "#2D3436", lineHeight: 21 },
  sectionTitle: { marginTop: 14, fontSize: 17, fontWeight: "700", color: "#2D3436" },
  menuItem: { color: "#2D3436", marginTop: 6 },
  whatsappButton: {
    marginTop: 14,
    backgroundColor: "#25D366",
    borderRadius: 12,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  whatsappText: { color: "#FFFFFF", fontWeight: "700" },
  emptyReview: { marginTop: 8, color: "#636E72" },
  reviewCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ECEFF1",
    borderRadius: 12,
    padding: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewUser: { fontWeight: "700", color: "#2D3436" },
  reviewMeta: { color: "#636E72", fontSize: 12 },
  reviewComment: { marginTop: 8, color: "#2D3436" },
});
