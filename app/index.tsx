import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from '../src/constants/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/LogoIgreja.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>I.M.I.F</Text>
      <Text style={styles.subtitle}>Desafio dos Depósitos</Text>
      <Text style={styles.description}>Juntos podemos conquistar um propósito maior!</Text>
      
      <Link href="/grid" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Entrar no Desafio</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/login" asChild>
        <TouchableOpacity style={[styles.button, styles.adminButton]}>
          <Text style={styles.adminButtonText}>Área Admin</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.text,
  },
  description: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  adminButton: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
