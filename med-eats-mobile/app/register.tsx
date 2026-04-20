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
import {
  getRegistrationFailedErrorMessage,
  validateRegistrationCredentials,
} from "@/src/services/authService";

export default function RegisterScreen() {
  const { register, isRegistering } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitDisabled = isRegistering || !email.trim() || !password.trim();

  const handleRegister = async () => {
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);

    const validation = validateRegistrationCredentials({ email, password });

    if (validation.emailError || validation.passwordError) {
      setEmailError(validation.emailError ?? null);
      setPasswordError(validation.passwordError ?? null);
      return;
    }

    try {
      await register({ email, password });
      router.replace("/(tabs)/home");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : getRegistrationFailedErrorMessage();
      setFormError(message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Register with your email and password.</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              style={[styles.input, emailError ? styles.inputError : null]}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="At least 8 chars, 1 uppercase and 1 number"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, passwordError ? styles.inputError : null]}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <Pressable
            style={[styles.registerButton, isSubmitDisabled && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitDisabled}
          >
            {isRegistering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/login" as never)} style={styles.linkButton}>
            <Text style={styles.linkText}>Already have an account? Log in</Text>
          </Pressable>
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
  inputError: {
    borderColor: "#D63031",
  },
  errorText: {
    marginTop: 6,
    color: "#D63031",
    fontWeight: "500",
    fontSize: 12,
  },
  registerButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonDisabled: {
    opacity: 0.55,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  linkButton: {
    marginTop: 14,
    alignItems: "center",
  },
  linkText: {
    color: "#636E72",
    fontWeight: "600",
  },
});
