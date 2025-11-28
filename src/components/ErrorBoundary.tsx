import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRestart = () => {
    // In a real app you might want to restart the app using RNRestart
    // For now we just reset the state to try rendering again
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Ops! Algo deu errado.</Text>
            <Text style={styles.subtitle}>
              Ocorreu um erro inesperado que impediu o funcionamento do aplicativo.
            </Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error && this.state.error.toString()}
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
              <Text style={styles.buttonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    maxHeight: 200,
  },
  errorText: {
    color: '#ff8080',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
