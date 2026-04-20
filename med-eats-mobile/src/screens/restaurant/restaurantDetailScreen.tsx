import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import { Restaurant, Review } from "../../models/domain";
import { useAuth } from "../../context/auth-context";
import {
  fetchReviewsByRestaurantId,
  createReview,
  updateReview,
  deleteReview,
} from "@/src/services/reviewApi";
import {
  isRestaurantSaved,
  saveRestaurant,
  unsaveRestaurant,
} from "../../services/userCollectionsApi";
import ReviewModal from "../../components/ReviewModal";

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

  // Estados para el Modal de Reseñas
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const data = await fetchReviewsByRestaurantId(restaurant.id);
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [restaurant.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
      router.push("/login");
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

  const handleOpenCreateModal = () => {
    setEditingReview(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (review: Review) => {
    setEditingReview(review);
    setModalVisible(true);
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      router.push("/login");
      return;
    }

    if (editingReview) {
      await updateReview(accessToken, editingReview.id, { rating, comment });
    } else {
      await createReview(accessToken, { restaurantId: restaurant.id, rating, comment });
    }
    loadReviews();
  };

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      "Eliminar Reseña",
      "¿Estás seguro de que quieres eliminar tu reseña? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const accessToken = await getAccessToken();
            if (accessToken) {
              try {
                await deleteReview(accessToken, reviewId);
                loadReviews();
              } catch (error) {
                Alert.alert("Error", "No se pudo eliminar la reseña.");
              }
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ================= HERO IMAGE & HEADER STRIP ================= */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: restaurant.image }} style={styles.heroImage} />
          
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
          
          <View style={styles.ratingCategoryRow}>
            <RatingStars rating={restaurant.rating} size={15} />
            <Text style={styles.ratingNumber}>{restaurant.rating}</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.categoryText}>{restaurant.category}</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color="#FF6B35" />
            <Text style={styles.locationText}>{restaurant.location}</Text>
          </View>

          <Text style={styles.description}>{restaurant.description}</Text>

          {/* View Menu Button */}
          <Pressable style={styles.viewMenuButton}>
            <Ionicons name="list" size={22} color="#FFFFFF" />
            <Text style={styles.viewMenuText}>Ver Menú</Text>
          </Pressable>

          {/* ================= REVIEWS SECTION ================= */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reseñas y Calificaciones</Text>
              <Pressable style={styles.addReviewButton} onPress={handleOpenCreateModal}>
                <Ionicons name="add-circle-outline" size={20} color="#FF6B35" />
                <Text style={styles.addReviewText}>Escribir</Text>
              </Pressable>
            </View>

            {reviewsLoading ? (
              <ActivityIndicator size="small" color="#FF6B35" style={{ marginTop: 20 }} />
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyReview}>Aún no hay reseñas. ¡Sé el primero!</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.avatar || "https://ui-avatars.com/api/?name=" + review.username }}
                      style={styles.reviewAvatar}
                    />
                    <View style={styles.reviewMetaContainer}>
                      <View style={styles.reviewUserRow}>
                        <Text style={styles.reviewUser}>{review.username}</Text>
                        {review.isOwner && (
                          <View style={styles.ownerActions}>
                            <Pressable onPress={() => handleOpenEditModal(review)}>
                              <Ionicons name="pencil-outline" size={16} color="#636E72" />
                            </Pressable>
                            <Pressable onPress={() => handleDeleteReview(review.id)}>
                              <Ionicons name="trash-outline" size={16} color="#E63946" />
                            </Pressable>
                          </View>
                        )}
                      </View>
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

      {/* ================= MODAL DE RESEÑA ================= */}
      <ReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleReviewSubmit}
        initialRating={editingReview?.rating}
        initialComment={editingReview?.comment}
        isEditing={!!editingReview}
      />
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
    height: 320,
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
    backgroundColor: "#FF6B35",
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
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D3436",
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addReviewText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyReview: {
    color: "#636E72",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  reviewCard: {
    backgroundColor: "#F8F9FA",
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
  reviewUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewUser: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3436",
  },
  ownerActions: {
    flexDirection: "row",
    gap: 12,
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
