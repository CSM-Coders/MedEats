import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "@/src/context/auth-context";
import { getInvalidCredentialsErrorMessage } from "@/src/services/authService";

export default function LoginScreen() {
  const { login, isLoggingIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitDisabled = isLoggingIn || !username.trim() || !password.trim();

  const handleLogin = async () => {
    setErrorMessage(null);

    try {
      await login({ username, password });
      router.replace("/(tabs)/home");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : getInvalidCredentialsErrorMessage();
      setErrorMessage(message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to continue to your account.</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            style={[styles.loginButton, isSubmitDisabled && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitDisabled}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </Pressable>

          <Text style={styles.helperText}>Demo credentials: foodlover_med / Medeats123!</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF4F0",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D3436",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14,
    color: "#636E72",
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    color: "#2D3436",
    fontWeight: "600",
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FBFCFD",
    color: "#2D3436",
  },
  errorText: {
    marginTop: 2,
    marginBottom: 10,
    color: "#D63031",
    fontWeight: "500",
  },
  loginButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  helperText: {
    marginTop: 14,
    fontSize: 12,
    color: "#98A0A6",
    textAlign: "center",
  },
});
