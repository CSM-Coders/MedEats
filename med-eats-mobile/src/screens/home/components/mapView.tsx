import { View, Text, StyleSheet } from "react-native";

export default function MapView() {
	return (
		<View style={styles.map}>
			<Text style={styles.text}>MAPA (placeholder)</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	map: {
		flex: 1,
		backgroundColor: "#111",
		alignItems: "center",
		justifyContent: "center",
	},
	text: {
		color: "#fff",
		opacity: 0.6,
	},
});
