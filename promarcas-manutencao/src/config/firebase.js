import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBXRlcaJF8U-7-xF-7C0IgIn3TS_BldouQ",
  authDomain: "aplicativocadastro-53123.firebaseapp.com",
  projectId: "aplicativocadastro-53123",
  storageBucket: "aplicativocadastro-53123.firebasestorage.app",
  messagingSenderId: "867296159917",
  appId: "1:867296159917:web:d38c2fca0fcb4274977e24"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
