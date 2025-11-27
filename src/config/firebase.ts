import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAfkjyQ1qhQbke_BX2J1PHtuaJqwLvr-NQ",
  authDomain: "churchfundraisingapp.firebaseapp.com",
  projectId: "churchfundraisingapp",
  storageBucket: "churchfundraisingapp.firebasestorage.app",
  messagingSenderId: "563183230426",
  appId: "1:563183230426:web:d86c5c2a53e6b63489b4e3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
