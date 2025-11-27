import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeToContributions, confirmContribution, addManualContribution, resetAllContributions } from '../src/services/contributionService';
import { getCurrentUser, signOut, createAdmin, getAllAdmins, updateAdmin, deleteAdmin } from '../src/services/authService';
import { subscribeToConfig, updateChallengeSize } from '../src/services/configService';
import { Contribution, Admin } from '../src/types';

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
  
  // Challenge size state
  const [challengeSize, setChallengeSize] = useState(100);
  const [newChallengeSize, setNewChallengeSize] = useState('');
  
  // Admin management state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [editAdminName, setEditAdminName] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    const unsubscribeContributions = subscribeToContributions((data) => {
      // Sort: Pending first, then by number
      const sorted = data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return a.number - b.number;
      });
      setContributions(sorted);
    });
    
    const unsubscribeConfig = subscribeToConfig((config) => {
      setChallengeSize(config.challengeSize);
      setNewChallengeSize(config.challengeSize.toString());
    });
    
    // Load admins
    loadAdmins();
    
    return () => {
      unsubscribeContributions();
      unsubscribeConfig();
    };
  }, []);
  
  const loadAdmins = async () => {
    try {
      const adminsList = await getAllAdmins();
      setAdmins(adminsList as Admin[]);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

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
    if (contributions.find((c: Contribution) => c.number === num)) {
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
      await loadAdmins();
      Alert.alert('Sucesso', 'Administrador criado com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar administrador.');
    }
  };
  
  const handleResetContributions = () => {
    Alert.alert(
      '⚠️ Resetar Contribuições',
      'ATENÇÃO: Isso irá apagar TODAS as contribuições (pendentes e confirmadas). Esta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Resetar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllContributions();
              Alert.alert('Sucesso', 'Todas as contribuições foram removidas.');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao resetar contribuições.');
            }
          }
        }
      ]
    );
  };
  
  const handleUpdateChallengeSize = async () => {
    const size = parseInt(newChallengeSize);
    if (isNaN(size) || size < 50 || size > 300) {
      Alert.alert('Erro', 'Tamanho deve estar entre 50 e 300.');
      return;
    }
    
    try {
      await updateChallengeSize(size);
      Alert.alert('Sucesso', `Tamanho do desafio atualizado para ${size}.`);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar tamanho.');
    }
  };
  
  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setEditAdminName(admin.nome);
    setAdminModalVisible(true);
  };
  
  const handleSaveAdmin = async () => {
    if (!editingAdmin || !editAdminName) {
      Alert.alert('Erro', 'Preencha o nome.');
      return;
    }
    
    try {
      await updateAdmin(editingAdmin.email, { nome: editAdminName });
      setAdminModalVisible(false);
      setEditingAdmin(null);
      setEditAdminName('');
      await loadAdmins();
      Alert.alert('Sucesso', 'Administrador atualizado.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar.');
    }
  };
  
  const handleDeleteAdmin = (admin: Admin) => {
    Alert.alert(
      'Excluir Administrador',
      `Deseja realmente excluir ${admin.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdmin(admin.email);
              await loadAdmins();
              Alert.alert('Sucesso', 'Administrador removido.');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Falha ao excluir.');
            }
          }
        }
      ]
    );
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
    <ScrollView style={styles.container}>
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

      {/* Challenge Size Configuration */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>⚙️ Configurações</Text>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Tamanho do Desafio:</Text>
          <View style={styles.configRow}>
            <TextInput
              style={styles.configInput}
              value={newChallengeSize}
              onChangeText={setNewChallengeSize}
              keyboardType="numeric"
              placeholder="50-300"
            />
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={handleUpdateChallengeSize}
            >
              <Text style={styles.updateButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.configHint}>Atual: {challengeSize} | Permitido: 50-300</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetContributions}
        >
          <Text style={styles.resetButtonText}>🗑️ Resetar Todas as Contribuições</Text>
        </TouchableOpacity>
      </View>

      {/* Admin Management */}
      <View style={styles.adminSection}>
        <Text style={styles.sectionTitle}>👥 Administradores</Text>
        {admins.map((admin: Admin) => (
          <View key={admin.email} style={styles.adminItem}>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{admin.nome}</Text>
              <Text style={styles.adminEmail}>{admin.email}</Text>
            </View>
            <View style={styles.adminActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditAdmin(admin)}
              >
                <Text style={styles.editButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteAdmin(admin)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Contributions Section */}
      <View style={styles.contributionsSection}>
        <Text style={styles.sectionTitle}>💰 Contribuições</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Adicionar Manualmente</Text>
        </TouchableOpacity>

        <FlatList
          data={contributions}
          renderItem={renderItem}
          keyExtractor={(item: Contribution) => item.id}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />
      </View>

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

      {/* Edit Admin Modal */}
      <Modal
        visible={adminModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Administrador</Text>
            
            <Text style={styles.input}>{editingAdmin?.email}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={editAdminName}
              onChangeText={setEditAdminName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAdminModalVisible(false);
                  setEditingAdmin(null);
                  setEditAdminName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveAdmin}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  // New styles for config section
  configSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  configItem: {
    marginBottom: 15,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  configInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  configHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  resetButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Admin management styles
  adminSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  adminItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 8,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  adminEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  // Contributions section
  contributionsSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
});
