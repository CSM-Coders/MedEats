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

import { colors, radii, spacing } from "@/src/theme/designTokens";
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
              placeholderTextColor={colors.placeholder}
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
              placeholderTextColor={colors.placeholder}
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
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/register" as never)} style={styles.linkButton}>
            <Text style={styles.linkText}>Don&apos;t have an account? Create one</Text>
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
    backgroundColor: colors.surfaceAlt,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontSize: 14,
    color: colors.textMuted,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.text,
    fontWeight: "600",
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.input,
    color: colors.text,
  },
  errorText: {
    marginTop: 2,
    marginBottom: spacing.md,
    color: colors.danger,
    fontWeight: "500",
  },
  loginButton: {
    marginTop: spacing.xs,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginButtonText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  linkText: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  helperText: {
    marginTop: spacing.lg,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: "center",
  },
});

