import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import { useAuth } from "@/src/context/auth-context";
import { Restaurant, Review } from "@/src/models/domain";
import {
  addRestaurantBranch,
  createMyRestaurant,
  deleteRestaurantBranch,
  fetchMyRestaurants,
  fetchOwnerReviews,
  updateMyRestaurant,
  uploadRestaurantMenuPdf,
} from "@/src/services/ownerRestaurantApi";

type RestaurantFormState = {
  name: string;
  location: string;
  description: string;
  category: string;
  manualLat: number | null;
  manualLon: number | null;
  imageUri?: string;
  imageName?: string;
  whatsapp: string;
  menuPdfUri?: string;
  menuPdfName?: string;
  menuPdfMimeType?: string;
};

type BranchFormState = {
  address: string;
  isPrimary: boolean;
  latitude: number | null;
  longitude: number | null;
};

function getDefaultRestaurantForm(restaurant?: Restaurant | null): RestaurantFormState {
  return {
    name: restaurant?.name ?? "",
    location: restaurant?.location ?? "",
    description: restaurant?.description ?? "",
    category: restaurant?.category ?? "Burgers & Grill",
    manualLat: restaurant?.latitude ?? null,
    manualLon: restaurant?.longitude ?? null,
    imageUri: restaurant?.image || undefined,
    imageName: restaurant?.image ? "Imagen actual" : undefined,
    whatsapp: restaurant?.whatsapp ?? "",
    menuPdfUri: undefined,
    menuPdfName: undefined,
    menuPdfMimeType: undefined,
  };
}

export default function MyRestaurantScreen() {
  const { getAccessToken, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMenu, setIsUploadingMenu] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [form, setForm] = useState<RestaurantFormState>(getDefaultRestaurantForm());
  const [branchForm, setBranchForm] = useState<BranchFormState>({
    address: "",
    isPrimary: false,
    latitude: null,
    longitude: null,
  });
  const [ownerReviews, setOwnerReviews] = useState<Review[]>([]);

  const loadData = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const restaurants = await fetchMyRestaurants(token);
      const firstRestaurant = restaurants[0] ?? null;
      setRestaurant(firstRestaurant);
      setForm(getDefaultRestaurantForm(firstRestaurant));

      if (firstRestaurant) {
        const reviews = await fetchOwnerReviews(token, firstRestaurant.id);
        setOwnerReviews(reviews);
      } else {
        setOwnerReviews([]);
      }
    } catch {
      setRestaurant(null);
      setOwnerReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setBranchForm(prev => ({
      ...prev,
      latitude,
      longitude
    }));
    Alert.alert("Ubicación seleccionada", "Has marcado un punto manual en el mapa para esta sede.");
  };

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => undefined);
    }, [loadData])
  );

  const hasRestaurant = Boolean(restaurant);

  const canSubmitRestaurant =
    !!form.name.trim() &&
    !!form.location.trim() &&
    !!form.description.trim() &&
    !!form.whatsapp.trim();

  const canCreateBranch =
    hasRestaurant &&
    !!branchForm.address.trim();

  const mapRegion = useMemo(() => {
    const latitude = restaurant?.latitude || 6.2442;
    const longitude = restaurant?.longitude || -75.5812;

    return {
      latitude,
      longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [restaurant?.latitude, restaurant?.longitude]);

  const handleSaveRestaurant = async () => {
    const token = await getAccessToken();
    if (!token) {
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("location", form.location.trim());
      formData.append("description", form.description.trim());
      formData.append("whatsapp", form.whatsapp.trim());

      // Usar coordenadas manuales del mapa (el usuario tocó el mapa)
      if (form.manualLat && form.manualLon) {
        formData.append("latitude", String(form.manualLat));
        formData.append("longitude", String(form.manualLon));
      }

      // Si hay imagen seleccionada del dispositivo, adjunta
      if (form.imageUri && form.imageName && !form.imageUri.startsWith('http')) {
        formData.append("image_file", {
          uri: form.imageUri,
          name: form.imageName,
          type: "image/jpeg",
        } as unknown as Blob);
      }

      let finalSaved = restaurant
        ? await updateMyRestaurant(token, restaurant.id, formData)
        : await createMyRestaurant(token, formData);

      // Si hay un PDF seleccionado, subirlo inmediatamente después de crear/actualizar
      if (form.menuPdfUri && form.menuPdfName) {
        try {
          finalSaved = await uploadRestaurantMenuPdf(token, finalSaved.id, {
            uri: form.menuPdfUri,
            name: form.menuPdfName,
            mimeType: form.menuPdfMimeType,
          });
        } catch (pdfError: any) {
          console.warn("Error subiendo PDF:", pdfError);
          Alert.alert("Aviso", "El restaurante se guardó pero hubo un error al subir el PDF. Intenta subirlo de nuevo.");
        }
      }

      setRestaurant(finalSaved);
      setForm(getDefaultRestaurantForm(finalSaved));
      
      // Forzar recarga de datos para asegurar sincronización
      await loadData();
      
      Alert.alert("Listo", restaurant ? "Restaurante actualizado correctamente." : "Restaurante creado correctamente.");
      const reviews = await fetchOwnerReviews(token, finalSaved.id);
      setOwnerReviews(reviews);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar la información del restaurante.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!branchForm.address.trim() || !restaurant) return;

    try {
      setIsSaving(true);
      const token = await getAccessToken();
      if (!token) return;

      await addRestaurantBranch(token, restaurant.id, {
        address: branchForm.address,
        isPrimary: branchForm.isPrimary,
        latitude: branchForm.latitude || undefined,
        longitude: branchForm.longitude || undefined,
      });

      // Recargar datos
      await loadData();

      setBranchForm({
        address: "",
        isPrimary: false,
        latitude: null,
        longitude: null,
      });
      Alert.alert("Listo", "Sede agregada correctamente.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo agregar la sede.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    Alert.alert(
      "Eliminar sede",
      "¿Estás seguro de que quieres eliminar esta sede?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              setIsSaving(true);
              const token = await getAccessToken();
              if (!token) return;
              await deleteRestaurantBranch(token, branchId);
              await loadData();
            } catch (error: any) {
              Alert.alert("Error", "No se pudo eliminar la sede.");
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const handlePickImage = async () => {
    // Solicitar permisos y abrir galería
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const selectedFile = result.assets[0];
    
    // Extraer nombre del archivo desde la URI
    const filename = selectedFile.uri.split('/').pop() || 'restaurant_image.jpg';

    setForm((prev) => ({
      ...prev,
      imageUri: selectedFile.uri,
      imageName: filename,
    }));
  };

  const handlePickMenuPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const selectedFile = result.assets[0];

    setForm((prev) => ({
      ...prev,
      menuPdfUri: selectedFile.uri,
      menuPdfName: selectedFile.name,
      menuPdfMimeType: selectedFile.mimeType,
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando módulo Mi Restaurante...</Text>
      </View>
    );
  }

  if (!user?.isRestaurantAccount) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="lock-closed-outline" size={28} color="#636E72" />
        <Text style={styles.loadingText}>Este módulo es solo para cuentas de restaurante.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mi Restaurante</Text>
        <Text style={styles.subtitle}>
          Completa la ficha de tu restaurante principal y después agrega todas las sedes que tenga.
        </Text>

        <View style={styles.guidanceCard}>
          <Text style={styles.guidanceTitle}>Cómo llenar cada sección</Text>
          <Text style={styles.guidanceText}>1. Nombre, dirección (literal ej. Cra 42 #7a), descripción, foto.</Text>
          <Text style={styles.guidanceText}>2. Sedes: una dirección por sede. El sistema ubicará automáticamente.</Text>
          <Text style={styles.guidanceText}>3. Menú PDF: sube un archivo .pdf legible.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{hasRestaurant ? "Tu restaurante" : "Crear tu restaurante"}</Text>
          <Text style={styles.sectionHint}>
            Solo puedes tener un restaurante por cuenta. Si ya existe, aquí lo actualizas.
          </Text>

          <Text style={styles.fieldLabel}>Nombre del restaurante</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Hamburguesas Camilo"
            value={form.name}
            onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
          />
          <Text style={styles.fieldHelp}>Es el nombre público que verán los usuarios en la app.</Text>

          <Text style={styles.fieldLabel}>Dirección</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Carrera 42 #7a Sur 92"
            value={form.location}
            onChangeText={(value) => setForm((prev) => ({ ...prev, location: value }))}
          />
          <Text style={styles.fieldHelp}>Escribe la dirección para referencia. Luego toca el mapa para marcar la ubicación exacta.</Text>

          <Text style={styles.fieldLabel}>📍 Ubicación en el mapa</Text>
          <Text style={styles.fieldHelp}>Toca el mapa exactamente donde está tu restaurante.</Text>
          <MapView
            style={styles.locationPicker}
            region={{
              latitude: form.manualLat || 6.2442,
              longitude: form.manualLon || -75.5812,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            onPress={(e: any) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setForm(prev => ({ ...prev, manualLat: latitude, manualLon: longitude }));
            }}
          >
            {form.manualLat && form.manualLon && (
              <Marker
                coordinate={{ latitude: form.manualLat, longitude: form.manualLon }}
                title="Tu restaurante"
                pinColor="#FF6B35"
              />
            )}
          </MapView>
          {form.manualLat && form.manualLon ? (
            <Text style={[styles.fieldHelp, { color: '#2E7D32' }]}>✅ Ubicación seleccionada ({form.manualLat.toFixed(4)}, {form.manualLon.toFixed(4)})</Text>
          ) : (
            <Text style={[styles.fieldHelp, { color: '#E74C3C' }]}>⚠️ Toca el mapa para marcar la ubicación de tu restaurante</Text>
          )}

          <Text style={styles.fieldLabel}>Descripción</Text>
          <TextInput
            style={styles.input}
            placeholder="Cuenta qué ofreces, estilo de comida y experiencia"
            value={form.description}
            onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
            multiline
          />
          <Text style={styles.fieldHelp}>Resume el concepto del restaurante en 1 o 2 líneas.</Text>

          <Text style={styles.fieldLabel}>Foto del restaurante</Text>
          {form.imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: form.imageUri }} style={styles.imagePreview} />
              <Pressable 
                style={styles.removeImageOverlay} 
                onPress={() => setForm(prev => ({ ...prev, imageUri: undefined, imageName: undefined }))}
              >
                <Ionicons name="close-circle" size={24} color="#FF6B35" />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.secondaryButton} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={18} color="#FF6B35" />
              <Text style={styles.secondaryButtonText}>Seleccionar imagen</Text>
            </Pressable>
          )}
          <Text style={styles.fieldHelp}>Carga una imagen desde tu dispositivo (JPG o PNG).</Text>

          <Text style={styles.fieldLabel}>WhatsApp</Text>
          <View style={styles.whatsappRow}>
            <Text style={styles.whatsappPrefix}>+57</Text>
            <TextInput
              style={[styles.input, styles.whatsappInput]}
              placeholder="3001112233"
              value={form.whatsapp}
              onChangeText={(value) => setForm((prev) => ({ ...prev, whatsapp: value }))}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.fieldHelp}>Solo el número (9 dígitos) sin +57 porque ya está incluido.</Text>

          <Pressable
            style={[styles.primaryButton, (!canSubmitRestaurant || isSaving) && styles.disabledButton]}
            disabled={!canSubmitRestaurant || isSaving}
            onPress={handleSaveRestaurant}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{hasRestaurant ? "Guardar cambios" : "Crear restaurante"}</Text>}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={handlePickMenuPdf}
          >
            <Ionicons name="document-attach-outline" size={18} color="#FF6B35" />
            <Text style={styles.secondaryButtonText}>Subir menú PDF</Text>
          </Pressable>

          {form.menuPdfName ? (
            <Text style={styles.menuHint}>PDF listo para guardar: {form.menuPdfName}</Text>
          ) : restaurant?.menuPdfUrl ? (
            <Text style={styles.menuHint}>Menú actual cargado correctamente.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sedes en mapa</Text>
          <Text style={styles.sectionHint}>
            Agrega cada sede con su dirección. Todas aparecerán en el mapa principal y en tu ficha pública. Toca el mapa abajo para fijar cada ubicación.
          </Text>

          <Text style={styles.fieldLabel}>Dirección de la sede</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Carrera 80 # 50-10, Laureles"
            value={branchForm.address}
            onChangeText={(value) => setBranchForm((prev) => ({ ...prev, address: value }))}
          />
          <Text style={styles.fieldHelp}>Escribe la dirección y luego toca el mapa abajo para fijar el punto exacto.</Text>

          <Text style={styles.fieldLabel}>📍 Ubicar nueva sede</Text>
          <MapView
            style={styles.locationPicker}
            region={{
              latitude: branchForm.latitude || restaurant?.latitude || 6.2442,
              longitude: branchForm.longitude || restaurant?.longitude || -75.5812,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            onPress={(e: any) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setBranchForm(prev => ({ ...prev, latitude, longitude }));
            }}
          >
            {/* Pin de la sede que estamos creando actualmente */}
            {branchForm.latitude && branchForm.longitude && (
              <Marker
                coordinate={{ latitude: branchForm.latitude, longitude: branchForm.longitude }}
                title="Nueva Sede"
                pinColor="#2E7D32"
              />
            )}
            
            {/* Referencia: Sedes existentes */}
            {restaurant?.branches?.map((branch) => (
              <Marker
                key={branch.id}
                coordinate={{ latitude: branch.latitude, longitude: branch.longitude }}
                title="Sede existente"
                pinColor="#1D4ED8"
                opacity={0.6}
              />
            ))}
            
            {/* Referencia: Sede principal */}
            {restaurant && (
              <Marker
                coordinate={{ latitude: restaurant.latitude, longitude: restaurant.longitude }}
                title="Sede Principal"
                pinColor="#FF6B35"
                opacity={0.6}
              />
            )}
          </MapView>
          
          {branchForm.latitude ? (
            <Text style={[styles.fieldHelp, { color: '#2E7D32' }]}>✅ Ubicación de sede marcada</Text>
          ) : (
            <Text style={[styles.fieldHelp, { color: '#E74C3C' }]}>⚠️ Toca el mapa para ubicar esta sede</Text>
          )}

          <Pressable
            style={[styles.primaryButton, (!canCreateBranch || isSaving) && styles.disabledButton]}
            disabled={!canCreateBranch || isSaving}
            onPress={handleCreateBranch}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Agregar sede</Text>}
          </Pressable>

          <View style={styles.branchList}>
            {(restaurant?.branches ?? []).map((branch) => (
              <View key={branch.id} style={styles.branchItem}>
                <View style={styles.branchInfo}>
                  <Text style={styles.branchTitle}>{restaurant?.name || "Restaurante"}</Text>
                  <Text style={styles.branchAddress}>{branch.address}</Text>
                </View>
                <Pressable 
                  style={styles.deleteBranchButton}
                  onPress={() => handleDeleteBranch(branch.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4757" />
                </Pressable>
              </View>
            ))}
            {!restaurant?.branches?.length ? (
              <Text style={styles.emptyText}>Aún no hay sedes registradas.</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reseñas recibidas</Text>
          {ownerReviews.length === 0 ? (
            <Text style={styles.emptyText}>Aún no tienes reseñas.</Text>
          ) : (
            ownerReviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewRestaurant}>{review.restaurantName || "Restaurante"}</Text>
                  <Text style={styles.reviewRating}>{review.rating.toFixed(1)} ★</Text>
                </View>
                <Text style={styles.reviewUser}>@{review.username}</Text>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF4F0",
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF4F0",
  },
  loadingText: {
    marginTop: 10,
    color: "#636E72",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D3436",
  },
  subtitle: {
    color: "#636E72",
    lineHeight: 20,
  },
  guidanceCard: {
    backgroundColor: "#FFF7F3",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFD9CC",
    gap: 6,
  },
  guidanceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2D3436",
    marginBottom: 2,
  },
  guidanceText: {
    color: "#636E72",
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 4,
  },
  sectionHint: {
    color: "#636E72",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2D3436",
    marginTop: 2,
  },
  fieldHelp: {
    color: "#8A8A8A",
    fontSize: 12,
    lineHeight: 16,
    marginTop: -2,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FBFCFD",
    color: "#2D3436",
  },
  whatsappRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  whatsappPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
    paddingVertical: 12,
  },
  whatsappInput: {
    flex: 1,
  },
  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },
  halfColumn: {
    flex: 1,
    gap: 4,
  },
  halfInput: {
    flex: 1,
  },
  primaryButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#FF6B35",
    fontWeight: "700",
  },
  menuHint: {
    color: "#2E7D32",
    fontSize: 12,
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  locationPicker: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  branchList: {
    gap: 8,
  },
  branchItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EAEDEF",
  },
  branchInfo: {
    flex: 1,
  },
  branchTitle: {
    fontWeight: "700",
    color: "#2D3436",
    fontSize: 14,
  },
  branchAddress: {
    color: "#636E72",
    marginTop: 2,
    fontSize: 13,
  },
  deleteBranchButton: {
    padding: 8,
    marginLeft: 10,
  },
  emptyText: {
    color: "#636E72",
    fontStyle: "italic",
  },
  reviewItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewRestaurant: {
    fontWeight: "700",
    color: "#2D3436",
  },
  reviewRating: {
    color: "#FF6B35",
    fontWeight: "700",
  },
  reviewUser: {
    color: "#636E72",
    fontSize: 12,
  },
  reviewComment: {
    color: "#2D3436",
  },
  imagePreviewWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#DFE6E9",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
  },
});
