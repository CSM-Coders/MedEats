import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { Restaurant, Review } from "@/src/models/domain";
import { useAuth } from "@/src/context/auth-context";
import { fetchReviewsByRestaurantId } from "@/src/services/reviewApi";
import {
  isRestaurantSaved,
  saveRestaurant,
  unsaveRestaurant,
} from "@/src/services/userCollectionsApi";

type Props = {
  restaurant: Restaurant;
};

// Función helper para dibujar las estrellas doradas dinámicamente
function RatingStars({ rating, size = 16 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={
            i <= fullStars
              ? "star"
              : i === fullStars + 1 && hasHalf
              ? "star-half"
              : "star-outline"
          }
          size={size}
          color="#FFB300" // Amarillo dorado exacto del mockup para estrellas
        />
      ))}
    </View>
  );
}

export default function RestaurantDetailScreen({ restaurant }: Props) {
  const insets = useSafeAreaInsets();
  const { getAccessToken } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await fetchReviewsByRestaurantId(restaurant.id);
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [restaurant.id]);

  useFocusEffect(
    useCallback(() => {
      const loadSavedState = async () => {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          setIsSaved(false);
          return;
        }

        try {
          const saved = await isRestaurantSaved(accessToken, restaurant.id);
          setIsSaved(saved);
        } catch {
          setIsSaved(false);
        }
      };

      loadSavedState().catch(() => undefined);
    }, [getAccessToken, restaurant.id])
  );

  const handleToggleSaved = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken || saveLoading) {
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        await unsaveRestaurant(accessToken, restaurant.id);
        setIsSaved(false);
      } else {
        await saveRestaurant(accessToken, restaurant.id);
        setIsSaved(true);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable container that ignores the top notch for the full bleed hero image */}
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ================= HERO IMAGE & HEADER STRIP ================= */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.heroImage} />
          
          {/* Top Actions: Back, Favorite, Share OVERLAY */}
          <View style={[styles.headerActions, { top: insets.top + 8 }]}>
            <Pressable style={styles.iconCircle} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#2D3436" />
            </Pressable>
            
            <View style={styles.rightActions}>
              <Pressable style={styles.iconCircle} onPress={handleToggleSaved}>
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={20}
                  color={isSaved ? "#E63946" : "#2D3436"}
                />
              </Pressable>
              <Pressable style={styles.iconCircle}>
                <Ionicons name="share-social-outline" size={20} color="#2D3436" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ================= MAIN RESTAURANT INFO ================= */}
        <View style={styles.content}>
          <Text style={styles.title}>{restaurant.name}</Text>
          
          {/* Rating and Category Row */}
          <View style={styles.ratingCategoryRow}>
            <RatingStars rating={restaurant.rating} size={15} />
            <Text style={styles.ratingNumber}>{restaurant.rating}</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.categoryText}>{restaurant.category}</Text>
          </View>

          {/* Location Row */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color="#FF6B35" />
            <Text style={styles.locationText}>{restaurant.location}</Text>
          </View>

          <Text style={styles.description}>{restaurant.description}</Text>

          {/* View Menu Button */}
          <Pressable style={styles.viewMenuButton}>
            <Ionicons name="list" size={22} color="#FFFFFF" />
            <Text style={styles.viewMenuText}>View Menu</Text>
          </Pressable>

          {/* ================= REVIEWS SECTION ================= */}
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Reviews & Ratings</Text>

            {reviewsLoading ? (
              <Text style={styles.emptyReview}>Loading reviews...</Text>
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyReview}>No reviews yet.</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                    <View style={styles.reviewMetaContainer}>
                      <Text style={styles.reviewUser}>{review.username}</Text>
                      <View style={styles.reviewStarsDate}>
                        <RatingStars rating={review.rating} size={13} />
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heroContainer: {
    position: "relative",
    width: "100%",
    height: 320, // Altura prominente como en el mockup
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerActions: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  rightActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 10,
  },
  ratingCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingNumber: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3436",
  },
  dotSeparator: {
    marginHorizontal: 8,
    color: "#B2BEC3",
    fontWeight: "800",
  },
  categoryText: {
    fontSize: 14,
    color: "#636E72",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#636E72",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#636E72",
    marginBottom: 28,
  },
  viewMenuButton: {
    backgroundColor: "#FF6B35", // Naranja vibrante
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 12,
    gap: 10,
    marginBottom: 36,
  },
  viewMenuText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  reviewsSection: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 18,
  },
  emptyReview: {
    color: "#636E72",
    fontStyle: "italic",
  },
  reviewCard: {
    backgroundColor: "#F8F9FA", // Fondo gris super claro sin bordes
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  reviewMetaContainer: {
    flex: 1,
    gap: 4,
  },
  reviewUser: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3436",
  },
  reviewStarsDate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewDate: {
    fontSize: 13,
    color: "#B2BEC3",
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: "#636E72",
  },
});
