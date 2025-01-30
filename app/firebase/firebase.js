// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFQ9P2FY7xIdMxAepnlLWDsCdqZnwWm-Q",
  authDomain: "gemcoinz.firebaseapp.com",
  projectId: "gemcoinz",
  storageBucket: "gemcoinz.firebasestorage.app",
  messagingSenderId: "720071094338",
  appId: "1:720071094338:web:dcb0a0c9bbd329a24bbddb",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
