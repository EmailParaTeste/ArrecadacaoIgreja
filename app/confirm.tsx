import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { reserveNumber } from '../src/services/contributionService';

export default function ConfirmScreen() {
  const { number } = useLocalSearchParams();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await reserveNumber(Number(number), name, phone);
      Alert.alert('Sucesso', 'Número reservado com sucesso! Aguarde a confirmação do administrador.', [
        { text: 'OK', onPress: () => router.push('/grid') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível reservar o número. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar Número {number}</Text>

      {/* Bank Account Information */}
      <View style={styles.accountInfoContainer}>
        <Text style={styles.accountInfoTitle}>📋 Dados para Depósito</Text>
        <View style={styles.accountInfoBox}>
          <Text style={styles.accountLabel}>Banco:</Text>
          <Text style={styles.accountValue}>BAI - Banco Angolano de Investimentos</Text>
          
          <Text style={styles.accountLabel}>Titular:</Text>
          <Text style={styles.accountValue}>Igreja Evangélica</Text>
          
          <Text style={styles.accountLabel}>Número da Conta:</Text>
          <Text style={styles.accountValue}>0040 0000 0000 0000 0000</Text>
          
          <Text style={styles.accountLabel}>IBAN:</Text>
          <Text style={styles.accountValue}>AO06 0040 0000 0000 0000 0000 0000 0</Text>
          
          <Text style={styles.accountLabel}>Valor a Depositar:</Text>
          <Text style={styles.accountValueHighlight}>{number}.000,00 MZn</Text>
        </View>
      </View>

      <Text style={styles.formTitle}>Seus Dados</Text>

      <TextInput
        style={styles.input}
        placeholder="Seu Nome"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <TextInput
        style={styles.input}
        placeholder="Seu WhatsApp/Telefone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirmar Reserva</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  accountInfoContainer: {
    marginBottom: 20,
  },
  accountInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2196F3',
  },
  accountInfoBox: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  accountLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  accountValueHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
