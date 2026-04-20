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

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitDisabled =
    isRegistering || !username.trim() || !email.trim() || !password.trim();

  const handleRegister = async () => {
    setUsernameError(null);
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);

    const validation = validateRegistrationCredentials({ username, email, password });

    if (validation.usernameError || validation.emailError || validation.passwordError) {
      setUsernameError(validation.usernameError ?? null);
      setEmailError(validation.emailError ?? null);
      setPasswordError(validation.passwordError ?? null);
      return;
    }

    try {
      await register({ username, email, password });
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = extractErrorMessage(error);
      const field = getRegistrationFieldFromMessage(message);

      if (field === "username") {
        setUsernameError(message);
      } else if (field === "email") {
        setEmailError(message);
      } else if (field === "password") {
        setPasswordError(message);
      } else {
        setFormError(message);
      }
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
          <Text style={styles.subtitle}>
            Pick a username and register with your email and password.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder="your_username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, usernameError ? styles.inputError : null]}
            />
            {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
          </View>

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

          <Text style={styles.helperText}>
            Username must be 3-20 chars and can include letters, numbers, dots and underscores.
          </Text>
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
  helperText: {
    marginTop: 14,
    fontSize: 12,
    color: "#98A0A6",
    textAlign: "center",
  },
});

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const typedError = error as Record<string, unknown>;

    if (typeof typedError.message === "string" && typedError.message.trim()) {
      return typedError.message;
    }

    for (const value of Object.values(typedError)) {
      if (typeof value === "string" && value.trim()) {
        return value;
      }

      if (Array.isArray(value)) {
        const firstMessage = value.find((item) => typeof item === "string" && item.trim());
        if (typeof firstMessage === "string") {
          return firstMessage;
        }
      }
    }
  }

  return getRegistrationFailedErrorMessage();
}

function getRegistrationFieldFromMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("username")) {
    return "username" as const;
  }

  if (normalizedMessage.includes("email")) {
    return "email" as const;
  }

  if (normalizedMessage.includes("password")) {
    return "password" as const;
  }

  return null;
}
