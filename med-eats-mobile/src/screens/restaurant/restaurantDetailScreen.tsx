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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";
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
  markRestaurantVisited,
} from "../../services/userCollectionsApi";
import ReviewModal from "../../components/ReviewModal";
import { colors, radii, spacing } from "@/src/theme/designTokens";

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
          color={colors.accent} // Amarillo dorado exacto del mockup para estrellas
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

  const safeImageUri =
    typeof restaurant.image === "string" && /^(https?:\/\/|file:\/\/)/i.test(restaurant.image)
      ? restaurant.image
      : "";

  const safeName = typeof restaurant.name === "string" ? restaurant.name : "Restaurante";
  const safeCategory = typeof restaurant.category === "string" && restaurant.category.trim()
    ? restaurant.category
    : "Restaurante";
  const safeLocation = typeof restaurant.location === "string" ? restaurant.location : "Ubicación no disponible";
  const safeDescription = typeof restaurant.description === "string" ? restaurant.description : "";
  const safeRating = Number.isFinite(Number(restaurant.rating)) ? Number(restaurant.rating) : 0;

  const validBranches = (Array.isArray(restaurant.branches) ? restaurant.branches : []).filter(
    (branch) => branch && Number.isFinite(branch.latitude) && Number.isFinite(branch.longitude)
  );

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

    await markRestaurantVisited(accessToken, {
      restaurantId: restaurant.id,
      rating,
      note: comment,
    });

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
              } catch {
                Alert.alert("Error", "No se pudo eliminar la reseña.");
              }
            }
          },
        },
      ]
    );
  };

  const handleOpenMenuPdf = async () => {
    if (!restaurant.menuPdfUrl) {
      Alert.alert("Menú no disponible", "Este restaurante aún no ha cargado su menú PDF.");
      return;
    }

    const canOpen = await Linking.canOpenURL(restaurant.menuPdfUrl);
    if (!canOpen) {
      Alert.alert("No se pudo abrir", "No fue posible abrir el menú en este dispositivo.");
      return;
    }

    await Linking.openURL(restaurant.menuPdfUrl);
  };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ================= HERO IMAGE & HEADER STRIP ================= */}
        <View style={styles.heroContainer}>
          {safeImageUri ? (
            <Image source={{ uri: safeImageUri }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]} />
          )}
          
          <View style={[styles.headerActions, { top: insets.top + 8 }]}>
            <Pressable style={styles.iconCircle} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            
            <View style={styles.rightActions}>
              <Pressable style={styles.iconCircle} onPress={handleToggleSaved}>
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={20}
                  color={isSaved ? colors.primaryDark : colors.text}
                />
              </Pressable>
              <Pressable style={styles.iconCircle}>
                <Ionicons name="share-social-outline" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ================= MAIN RESTAURANT INFO ================= */}
        <View style={styles.content}>
          <Text style={styles.title}>{safeName}</Text>
          
          <View style={styles.ratingCategoryRow}>
            <RatingStars rating={safeRating} size={15} />
            <Text style={styles.ratingNumber}>{safeRating}</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.categoryText}>{safeCategory}</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.locationText}>{safeLocation}</Text>
          </View>

          <Text style={styles.description}>{safeDescription}</Text>

          {validBranches.length ? (
            <View style={styles.branchesSection}>
              <Text style={styles.sectionTitle}>Sedes en el mapa</Text>
              <Text style={styles.branchesHelp}>
                Aquí verás las sedes registradas por el restaurante. Toca un pin para ubicarlas.
              </Text>
              <MapView
                style={styles.branchesMap}
                initialRegion={{
                  latitude: validBranches[0].latitude,
                  longitude: validBranches[0].longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04,
                }}
              >
                {validBranches.map((branch) => (
                  <Marker
                    key={branch.id}
                    coordinate={{ latitude: branch.latitude, longitude: branch.longitude }}
                    title={branch.name || "Sede"}
                    description={branch.address}
                    pinColor={branch.isPrimary ? colors.primary : colors.accent}
                  />
                ))}
              </MapView>

              <View style={styles.branchList}>
                {validBranches.map((branch) => (
                  <View key={branch.id} style={styles.branchItem}>
                    <View style={styles.branchItemHeader}>
                      <Text style={styles.branchName}>{branch.name || "Sede"}</Text>
                      {branch.isPrimary ? <Text style={styles.primaryBadge}>Principal</Text> : null}
                    </View>
                    <Text style={styles.branchAddress}>{branch.address}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* View Menu Button */}
          <Pressable style={styles.viewMenuButton} onPress={handleOpenMenuPdf}>
            <Ionicons name="list" size={22} color={colors.background} />
            <Text style={styles.viewMenuText}>Ver menú PDF</Text>
          </Pressable>

          {/* ================= REVIEWS SECTION ================= */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reseñas y Calificaciones</Text>
              <Pressable style={styles.addReviewButton} onPress={handleOpenCreateModal}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addReviewText}>Escribir</Text>
              </Pressable>
            </View>

            {reviewsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyReview}>Aún no hay reseñas. ¡Sé el primero!</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.username)}` }}
                      style={styles.reviewAvatar}
                    />
                    <View style={styles.reviewMetaContainer}>
                      <View style={styles.reviewUserRow}>
                        <Text style={styles.reviewUser}>{review.username}</Text>
                        {review.isOwner && (
                          <View style={styles.ownerActions}>
                            <Pressable onPress={() => handleOpenEditModal(review)}>
                              <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
                            </Pressable>
                            <Pressable onPress={() => handleDeleteReview(review.id)}>
                              <Ionicons name="trash-outline" size={16} color={colors.danger} />
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
    backgroundColor: colors.background,
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
  heroFallback: {
    backgroundColor: colors.border,
  },
  headerActions: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  rightActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm + 2,
  },
  ratingCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingNumber: {
    marginLeft: spacing.sm,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  dotSeparator: {
    marginHorizontal: spacing.sm,
    color: colors.placeholder,
    fontWeight: "800",
  },
  categoryText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  locationText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  branchesSection: {
    marginBottom: spacing.xxl,
  },
  branchesHelp: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  branchesMap: {
    width: "100%",
    height: 220,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
  },
  branchList: {
    gap: spacing.sm,
  },
  branchItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  branchItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  branchName: {
    fontWeight: "700",
    color: colors.text,
  },
  primaryBadge: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  branchAddress: {
    color: colors.textMuted,
    fontSize: 13,
  },
  viewMenuButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginBottom: 36,
  },
  viewMenuText: {
    color: colors.background,
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
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  addReviewText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyReview: {
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.lg,
  },
  reviewMetaContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  reviewUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewUser: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  ownerActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  reviewStarsDate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewDate: {
    fontSize: 13,
    color: colors.placeholder,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});

