import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "@/src/theme/designTokens";
import { useAuth } from "@/src/context/auth-context";
import {
  fetchFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  FollowRequestRecord,
} from "@/src/services/userApi";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { getAccessToken } = useAuth();
  const [requests, setRequests] = useState<FollowRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchFollowRequests(accessToken);
      setRequests(data);
    } catch (error) {
      console.error("Error loading follow requests:", error);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const handleAccept = async (requestId: number) => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setActionLoadingId(requestId);
    try {
      await acceptFollowRequest(accessToken, requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setActionLoadingId(requestId);
    try {
      await rejectFollowRequest(accessToken, requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Solicitudes de seguimiento</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.bellCircle}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.placeholder} />
          </View>
          <Text style={styles.emptyTitle}>Sin solicitudes nuevas</Text>
          <Text style={styles.emptySubtitle}>
            Cuando alguien solicite seguirte para ver tu actividad, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={24} color={colors.placeholder} />
                  </View>
                )}
                <View style={styles.textContainer}>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                {actionLoadingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Pressable
                      style={styles.acceptButton}
                      onPress={() => handleAccept(item.id)}
                    >
                      <Text style={styles.acceptButtonText}>Aceptar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.rejectButton}
                      onPress={() => handleReject(item.id)}
                    >
                      <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  bellCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 12,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.chip,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  name: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "700",
  },
  rejectButton: {
    backgroundColor: colors.chip,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
