import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCHjgJkqVmgpZ6s5HRobpqB6XT--Sa2_zY",
  authDomain: "tgapp-30a28.firebaseapp.com",
  projectId: "tgapp-30a28",
  storageBucket: "tgapp-30a28.firebasestorage.app",
  messagingSenderId: "329047273664",
  appId: "1:329047273664:web:c9e1bfe367afb54953fd25",
  measurementId: "G-68P4PT49B0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
