import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Contribution, ContributionStatus } from '../types';

const CONTRIBUTIONS_COLLECTION = 'contributions';

export const subscribeToContributions = (callback: (contributions: Contribution[]) => void) => {
  const q = query(collection(db, CONTRIBUTIONS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const contributions: Contribution[] = [];
    snapshot.forEach((doc) => {
      contributions.push({ id: doc.id, ...doc.data() } as Contribution);
    });
    callback(contributions);
  });
};

export const reserveNumber = async (number: number, nome_usuario: string, numero_usuario: string) => {
  const contribution: Omit<Contribution, 'id'> = {
    number,
    nome_usuario,
    numero_usuario,
    status: 'pending',
    timestamp: serverTimestamp(),
  };
  await setDoc(doc(db, CONTRIBUTIONS_COLLECTION, number.toString()), contribution);
};

export const confirmContribution = async (id: string) => {
  await updateDoc(doc(db, CONTRIBUTIONS_COLLECTION, id), {
    status: 'confirmed' as ContributionStatus
  });
};

export const addManualContribution = async (number: number, nome_usuario: string, numero_usuario: string) => {
  const contribution: Omit<Contribution, 'id'> = {
    number,
    nome_usuario,
    numero_usuario,
    status: 'confirmed',
    timestamp: serverTimestamp(),
  };
  await setDoc(doc(db, CONTRIBUTIONS_COLLECTION, number.toString()), contribution);
};

export const resetAllContributions = async () => {
  const q = query(collection(db, CONTRIBUTIONS_COLLECTION));
  const snapshot = await getDocs(q);
  
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

export const rejectContribution = async (id: string) => {
  await deleteDoc(doc(db, CONTRIBUTIONS_COLLECTION, id));
};
