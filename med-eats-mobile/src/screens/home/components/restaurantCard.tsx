import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

type Props = {
  id: string;
  name: string;
  category: string;
  time: string;
};

export default function RestaurantCard({
  id,
  name,
  category,
  time,
}: Props) {
  return (
    <Pressable
      onPress={() => router.push(`/restaurant/${id}`)}
      style={styles.card}
    >
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>
        {category} · {time}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: "#aaa",
    marginTop: 4,
  },
});
