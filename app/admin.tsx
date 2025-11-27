import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeToContributions, confirmContribution, addManualContribution } from '../src/services/contributionService';
import { getCurrentUser, signOut, createAdmin } from '../src/services/authService';
import { Contribution } from '../src/types';

export default function AdminScreen() {
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [createAdminModalVisible, setCreateAdminModalVisible] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    const unsubscribe = subscribeToContributions((data) => {
      // Sort: Pending first, then by number
      const sorted = data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return a.number - b.number;
      });
      setContributions(sorted);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          onPress: async () => {
            await signOut();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleConfirm = async (id: string, number: number, name: string) => {
    Alert.alert(
      'Confirmar Pagamento',
      `Confirmar pagamento do número ${number} por ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              await confirmContribution(id);
            } catch (error) {
              Alert.alert('Erro', 'Falha ao confirmar.');
            }
          }
        }
      ]
    );
  };

  const handleAddManual = async () => {
    if (!manualNumber || !manualName || !manualPhone) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    const num = parseInt(manualNumber);
    if (isNaN(num) || num < 1 || num > 150) {
      Alert.alert('Erro', 'Número inválido.');
      return;
    }
    
    // Check if already taken
    if (contributions.find(c => c.number === num)) {
        Alert.alert('Erro', 'Número já escolhido.');
        return;
    }

    try {
      await addManualContribution(num, manualName, manualPhone);
      setModalVisible(false);
      setManualNumber('');
      setManualName('');
      setManualPhone('');
      Alert.alert('Sucesso', 'Contribuição adicionada.');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao adicionar.');
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminName) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      await createAdmin(newAdminEmail, newAdminPassword, newAdminName);
      setCreateAdminModalVisible(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminName('');
      Alert.alert('Sucesso', 'Administrador criado com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar administrador.');
    }
  };

  const renderItem = ({ item }: { item: Contribution }) => (
    <View style={styles.item}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNumber}>#{item.number}</Text>
        <Text style={styles.itemName}>{item.nome_usuario}</Text>
        <Text style={styles.itemPhone}>{item.numero_usuario}</Text>
        <Text style={[
          styles.itemStatus, 
          item.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending
        ]}>
          {item.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
        </Text>
      </View>
      
      {item.status === 'pending' && (
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={() => handleConfirm(item.id, item.number, item.nome_usuario)}
        >
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setCreateAdminModalVisible(true)}
        >
          <Text style={styles.headerButtonText}>+ Novo Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.headerButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.headerButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Adicionar Manualmente</Text>
      </TouchableOpacity>

      <FlatList
        data={contributions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      {/* Add Manual Contribution Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Contribuição</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Número (1-150)"
              keyboardType="numeric"
              value={manualNumber}
              onChangeText={setManualNumber}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Nome do Contribuinte"
              value={manualName}
              onChangeText={setManualName}
            />

            <TextInput
              style={styles.input}
              placeholder="WhatsApp/Telefone"
              keyboardType="phone-pad"
              value={manualPhone}
              onChangeText={setManualPhone}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddManual}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Admin Modal */}
      <Modal
        visible={createAdminModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateAdminModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cadastrar Novo Admin</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={newAdminEmail}
              onChangeText={setNewAdminEmail}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={newAdminPassword}
              onChangeText={setNewAdminPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={newAdminName}
              onChangeText={setNewAdminName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateAdminModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateAdmin}
              >
                <Text style={styles.modalButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 10,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemName: {
    fontSize: 16,
    color: '#666',
  },
  itemPhone: {
    fontSize: 14,
    color: '#999',
  },
  itemStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  statusPending: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  statusConfirmed: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
