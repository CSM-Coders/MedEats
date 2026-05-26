// ============================================================
// ERROR BOUNDARY GLOBAL
// ------------------------------------------------------------
// Captura cualquier error de React en su árbol de hijos y muestra
// una UI de recuperación en vez de que la app se cierre. Sin esto,
// un solo crash en cualquier pantalla cierra la app entera —
// inaceptable en producción.
//
// En dev muestra el stacktrace; en prod oculta los detalles internos.
// ============================================================

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En producción esto puede ir a Sentry, Crashlytics, etc.
    // Por ahora console.error es suficiente y aparece en el debug log.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = typeof __DEV__ !== "undefined" && __DEV__;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {this.props.fallbackTitle ?? "Algo salió mal"}
          </Text>
          <Text style={styles.message}>
            Ocurrió un error inesperado. Puedes intentar nuevamente.
          </Text>

          {isDev && this.state.error && (
            <ScrollView style={styles.errorBox}>
              <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.error.stack && (
                <Text style={styles.errorStack}>{this.state.error.stack}</Text>
              )}
            </ScrollView>
          )}

          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
    lineHeight: 20,
  },
  errorBox: {
    maxHeight: 220,
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#B22",
    fontFamily: "Courier",
  },
  errorStack: {
    fontSize: 11,
    color: "#666",
    fontFamily: "Courier",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#2F80ED",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
