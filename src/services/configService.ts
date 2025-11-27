import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppConfig } from '../types';

const CONFIG_DOC = 'config/app';

const DEFAULT_CONFIG: AppConfig = {
  challengeSize: 100
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
      console.log('Error initializing config (likely permission denied), using default');
    }
    return DEFAULT_CONFIG;
  }
};

export const updateChallengeSize = async (size: number): Promise<void> => {
  if (size < 50 || size > 300) {
    throw new Error('Challenge size must be between 50 and 300');
  }
  
  const docRef = doc(db, 'config', 'app');
  await setDoc(docRef, { challengeSize: size }, { merge: true });
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
        console.log('Error initializing config (likely permission denied), using default:', error);
        callback(DEFAULT_CONFIG);
      }
    }
  }, (error) => {
    console.error('Error subscribing to config:', error);
    // If we can't read config, use default
    callback(DEFAULT_CONFIG);
  });
};
