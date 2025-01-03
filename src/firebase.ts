import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgAfjiby-rHApMFBVoG-omIwRFTk85Xqo",
  authDomain: "stock-tracker-84cf1.firebaseapp.com",
  projectId: "stock-tracker-84cf1",
  storageBucket: "stock-tracker-84cf1.firebasestorage.app",
  messagingSenderId: "773205813587",
  appId: "1:773205813587:web:ad6e6e7111bd9cd06f99a6",
  measurementId: "G-WVMZDBWGYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);
