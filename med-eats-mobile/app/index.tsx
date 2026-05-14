// ============================================================
// WELCOME SCREEN (FR01)
// ------------------------------------------------------------
// Primera pantalla de MedEats. Muestra el branding de la app
// y botones para Iniciar Sesión o Registrarse.
// "Iniciar Sesión" abre la pantalla de login (FR03).
// "Crear Cuenta" abre la pantalla de registro (FR02).
// ============================================================

import { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors, radii, spacing } from "@/src/theme/designTokens";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  // Animaciones de entrada
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo aparece con zoom suave
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 10,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // 2. Textos aparecen
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // 3. Botones aparecen
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonsOpacity, logoOpacity, logoScale, textOpacity]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.background}>
        {/* Logo animado */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Image
            source={require("../assets/images/medeats-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Nombre y descripción */}
        <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
          <Text style={styles.title}>MedEats</Text>
          <Text style={styles.subtitle}>
            Discover the best food in Medellín
          </Text>
        </Animated.View>

        {/* Botones de acción */}
        <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity }]}>
          {/* Botón Iniciar Sesión */}
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push("/login" as never)}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </Pressable>

          {/* Botón Registrarse */}
          <Pressable
            style={styles.registerButton}
            onPress={() => router.push("/register" as never)}
          >
            <Text style={styles.registerButtonText}>Crear Cuenta</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
  },
  logoContainer: {
    width: width * 0.38,
    height: width * 0.38,
    backgroundColor: colors.background,
    borderRadius: width * 0.19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: spacing.xl,
  },
  logo: {
    width: width * 0.22,
    height: width * 0.22,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.background,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 48,
    gap: spacing.md + 2,
  },
  loginButton: {
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
  },
  registerButton: {
    backgroundColor: "transparent",
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.background,
  },
});

