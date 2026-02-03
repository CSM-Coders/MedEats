import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from '../../src/navigation/AppNavigator';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MedEats 🍽️</Text>
      <Text style={styles.subtitle}>
      </Text>
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    color: '#666',
  },
});
