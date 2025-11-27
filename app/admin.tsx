import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { subscribeToContributions, confirmContribution, addManualContribution, resetAllContributions, rejectContribution } from '../src/services/contributionService';
import { getCurrentUser, signOut, createAdmin, getAllAdmins, updateAdmin, deleteAdmin } from '../src/services/authService';
import { subscribeToConfig, updateChallengeSize, updateDepositConfig } from '../src/services/configService';
import { sendPushNotification } from '../src/services/notificationService';
import { Contribution, Admin, DepositConfig } from '../src/types';

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

  // Deposit Config State
  const [depositConfig, setDepositConfig] = useState<DepositConfig>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    nib: '',
    contact: ''
  });
  const [newDepositConfig, setNewDepositConfig] = useState<DepositConfig>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    nib: '',
    contact: ''
  });

  // Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

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
      if (config.deposit) {
        setDepositConfig(config.deposit);
        setNewDepositConfig(config.deposit);
      }
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

  // Dashboard Calculations
  const totalPotentialValue = (challengeSize * (challengeSize + 1)) / 2;
  const totalCollected = contributions
    .filter(c => c.status === 'confirmed')
    .reduce((sum, c) => sum + c.number, 0);
  const totalPending = contributions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.number, 0);
  const progressPercentage = totalPotentialValue > 0 ? (totalCollected / totalPotentialValue) * 100 : 0;

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

  const handleReject = async (id: string, number: number, name: string) => {
    Alert.alert(
      'Rejeitar Pedido',
      `Rejeitar pedido do número ${number} de ${name}? O número ficará disponível novamente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rejeitar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectContribution(id);
              Alert.alert('Sucesso', 'Pedido rejeitado e número liberado.');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao rejeitar.');
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

  const handleUpdateDepositConfig = async () => {
    try {
      await updateDepositConfig(newDepositConfig);
      Alert.alert('Sucesso', 'Dados de depósito atualizados.');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar dados de depósito.');
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle || !notifBody) {
      Alert.alert('Erro', 'Preencha título e mensagem.');
      return;
    }
    
    setSendingNotif(true);
    try {
      const result = await sendPushNotification(notifTitle, notifBody);
      Alert.alert('Sucesso', `Notificação enviada para ${result.count} dispositivos.`);
      setNotifTitle('');
      setNotifBody('');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar notificação.');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleQuickNotify = (title: string, body: string) => {
    setNotifTitle(title);
    setNotifBody(body);
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
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => handleConfirm(item.id, item.number, item.nome_usuario)}
          >
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleReject(item.id, item.number, item.nome_usuario)}
          >
            <Text style={styles.rejectButtonText}>Rejeitar</Text>
          </TouchableOpacity>
        </View>
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

      {/* Financial Dashboard */}
      <View style={styles.dashboardSection}>
        <Text style={styles.sectionTitle}>📊 Dashboard Financeiro</Text>
        
        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardLabel}>Arrecadado</Text>
            <Text style={styles.cardValue}>{totalCollected.toLocaleString()} MZN</Text>
          </View>
          
          <View style={[styles.card, styles.cardYellow]}>
            <Text style={styles.cardLabel}>Pendente</Text>
            <Text style={styles.cardValue}>{totalPending.toLocaleString()} MZN</Text>
          </View>
          
          <View style={[styles.card, styles.cardBlue]}>
            <Text style={styles.cardLabel}>Meta Total</Text>
            <Text style={styles.cardValue}>{totalPotentialValue.toLocaleString()} MZN</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progresso da Meta</Text>
            <Text style={styles.progressPercent}>{progressPercentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>
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

      {/* Deposit Configuration */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>🏦 Dados de Depósito</Text>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Banco:</Text>
          <TextInput
            style={styles.configInput}
            value={newDepositConfig.bankName}
            onChangeText={(text) => setNewDepositConfig({...newDepositConfig, bankName: text})}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Nome da Conta:</Text>
          <TextInput
            style={styles.configInput}
            value={newDepositConfig.accountName}
            onChangeText={(text) => setNewDepositConfig({...newDepositConfig, accountName: text})}
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Número da Conta:</Text>
          <TextInput
            style={styles.configInput}
            value={newDepositConfig.accountNumber}
            onChangeText={(text) => setNewDepositConfig({...newDepositConfig, accountNumber: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>NIB:</Text>
          <TextInput
            style={styles.configInput}
            value={newDepositConfig.nib}
            onChangeText={(text) => setNewDepositConfig({...newDepositConfig, nib: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Contacto:</Text>
          <TextInput
            style={styles.configInput}
            value={newDepositConfig.contact}
            onChangeText={(text) => setNewDepositConfig({...newDepositConfig, contact: text})}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity 
          style={styles.updateButton}
          onPress={handleUpdateDepositConfig}
        >
          <Text style={styles.updateButtonText}>Salvar Dados de Depósito</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Section */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>📢 Enviar Notificação</Text>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Título:</Text>
          <TextInput
            style={styles.configInput}
            value={notifTitle}
            onChangeText={setNotifTitle}
            placeholder="Ex: Atualização do Desafio"
          />
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Mensagem:</Text>
          <TextInput
            style={[styles.configInput, { height: 80, textAlignVertical: 'top' }]}
            value={notifBody}
            onChangeText={setNotifBody}
            placeholder="Digite a mensagem aqui..."
            multiline
          />
        </View>

        <View style={styles.quickNotifyContainer}>
          <TouchableOpacity 
            style={styles.quickNotifyButton}
            onPress={() => handleQuickNotify('🚀 Estamos na metade!', 'Já atingimos 50% da nossa meta! Continue participando.')}
          >
            <Text style={styles.quickNotifyText}>50%</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickNotifyButton}
            onPress={() => handleQuickNotify('🏁 Reta Final!', 'Faltam poucos números para completarmos o desafio!')}
          >
            <Text style={styles.quickNotifyText}>Reta Final</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickNotifyButton}
            onPress={() => handleQuickNotify('🎉 Desafio Concluído!', 'Obrigado a todos! Completamos o desafio com sucesso.')}
          >
            <Text style={styles.quickNotifyText}>Concluído</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.updateButton, sendingNotif && styles.disabledButton]}
          onPress={handleSendNotification}
          disabled={sendingNotif}
        >
          <Text style={styles.updateButtonText}>{sendingNotif ? 'Enviando...' : 'Enviar Notificação'}</Text>
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
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  rejectButtonText: {
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
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
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
    marginTop: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  },
  adminActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#FFC107',
    borderRadius: 5,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#F44336',
    borderRadius: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  contributionsSection: {
    marginBottom: 20,
  },
  // Dashboard Styles
  dashboardSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  card: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  cardGreen: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardYellow: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  cardBlue: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  quickNotifyContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  quickNotifyButton: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  quickNotifyText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 12,
  },
});