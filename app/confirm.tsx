import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { reserveNumber } from '../src/services/contributionService';
import { subscribeToConfig } from '../src/services/configService';
import { getErrorMessage } from '../src/utils/error';
import { DepositConfig } from '../src/types';
import { COLORS } from '../src/constants/theme';

export default function ConfirmScreen() {
  const { number } = useLocalSearchParams();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositConfig, setDepositConfig] = useState<DepositConfig | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToConfig((config) => {
      if (config.deposit) {
        setDepositConfig(config.deposit);
      }
    });
    return () => unsubscribe();
  }, []);

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
      Alert.alert('Erro', getErrorMessage(error));
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
          <Text style={styles.accountValue}>{depositConfig?.bankName || 'Carregando...'}</Text>
        
          <Text style={styles.accountLabel}>Nome da Conta:</Text>
          <Text style={styles.accountValue}>{depositConfig?.accountName || 'Carregando...'}</Text>
          
          <Text style={styles.accountLabel}>Número da Conta:</Text>
          <Text style={styles.accountValue}>{depositConfig?.accountNumber || 'Carregando...'}</Text>
          
          <Text style={styles.accountLabel}>NIB:</Text>
          <Text style={styles.accountValue}>{depositConfig?.nib || 'Carregando...'}</Text>
          
          <Text style={styles.accountLabel}>Valor a Depositar:</Text>
          <Text style={styles.accountValueHighlight}>{number} MZN</Text>
        </View>
      </View>

      <Text style={styles.formTitle}>Seus Dados</Text>

      <TextInput
        style={styles.input}
        placeholder="Seu Nome"
        placeholderTextColor={COLORS.textSecondary}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <TextInput
        style={styles.input}
        placeholder="Seu WhatsApp/Telefone"
        placeholderTextColor={COLORS.textSecondary}
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
          <ActivityIndicator color={COLORS.background} />
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
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: COLORS.primary,
  },
  accountInfoContainer: {
    marginBottom: 20,
  },
  accountInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.secondary,
  },
  accountInfoBox: {
    backgroundColor: COLORS.cardBackground,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  accountLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
  },
  accountValueHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 5,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    marginBottom: 15,
    color: COLORS.text,
    backgroundColor: COLORS.inputBackground,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
