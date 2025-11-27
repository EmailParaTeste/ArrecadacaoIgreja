import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const ADMINS_COLLECTION = 'admins';

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const createAdmin = async (email: string, password: string, nome: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Store admin info in Firestore
    await setDoc(doc(db, ADMINS_COLLECTION, email), {
      email,
      nome
    });
    
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getAllAdmins = async () => {
  const adminsCollection = collection(db, ADMINS_COLLECTION);
  const snapshot = await getDocs(adminsCollection);
  
  return snapshot.docs.map(doc => ({
    email: doc.id,
    ...doc.data()
  }));
};

export const updateAdmin = async (email: string, updates: { nome?: string; email?: string }) => {
  const adminRef = doc(db, ADMINS_COLLECTION, email);
  
  // If email is being changed, we need to delete old doc and create new one
  if (updates.email && updates.email !== email) {
    const currentData = (await getDocs(collection(db, ADMINS_COLLECTION))).docs
      .find(d => d.id === email)?.data();
    
    await deleteDoc(adminRef);
    await setDoc(doc(db, ADMINS_COLLECTION, updates.email), {
      ...currentData,
      ...updates
    });
  } else {
    await updateDoc(adminRef, updates);
  }
};

export const deleteAdmin = async (email: string) => {
  const adminRef = doc(db, ADMINS_COLLECTION, email);
  await deleteDoc(adminRef);
  // Note: This only deletes from Firestore, not from Firebase Auth
  // To delete from Auth, you'd need Firebase Admin SDK on the backend
};
