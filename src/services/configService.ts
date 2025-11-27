import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppConfig, DepositConfig } from '../types';

const CONFIG_DOC = 'config/app';

const DEFAULT_CONFIG: AppConfig = {
  challengeSize: 100,
  deposit: {
    bankName: 'BCI - Banco Comercial De Moçambique',
    accountName: 'Igreja',
    accountNumber: '0040 0000 0000 0000 0000',
    nib: '0040 0000 0000 0000 0000',
    contact: '840000000'
  }
};

export const getConfig = async (): Promise<AppConfig> => {
  const docRef = doc(db, 'config', 'app');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AppConfig;
  } else {
    // Initialize with default config
    try {
      await setDoc(docRef, DEFAULT_CONFIG);
    } catch (error) {
      console.log('Erro ao inicializar configuração (provavelmente permissão negada), usando padrão');
    }
    return DEFAULT_CONFIG;
  }
};

export const updateChallengeSize = async (size: number): Promise<void> => {
  if (size < 50 || size > 300) {
    throw new Error('O tamanho do desafio deve estar entre 50 e 300');
  }
  
  const docRef = doc(db, 'config', 'app');
  await setDoc(docRef, { challengeSize: size }, { merge: true });
};

export const updateDepositConfig = async (deposit: DepositConfig): Promise<void> => {
  const docRef = doc(db, 'config', 'app');
  await setDoc(docRef, { deposit }, { merge: true });
};

export const subscribeToConfig = (callback: (config: AppConfig) => void) => {
  const docRef = doc(db, 'config', 'app');
  
  return onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as AppConfig);
    } else {
      // Initialize with default config
      try {
        await setDoc(docRef, DEFAULT_CONFIG);
        callback(DEFAULT_CONFIG);
      } catch (error) {
        console.log('Erro ao inicializar configuração (provavelmente permissão negada), usando padrão:', error);
        callback(DEFAULT_CONFIG);
      }
    }
  }, (error) => {
    console.error('Erro ao assinar configuração:', error);
    // Se não conseguirmos ler a configuração, usamos o padrão
    callback(DEFAULT_CONFIG);
  });
};
