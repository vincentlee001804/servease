// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvi4HhubxzXmQfJppOFQpEM3jPqbHlsco",
  authDomain: "servease-07762363-b4f31.firebaseapp.com",
  projectId: "servease-07762363-b4f31",
  storageBucket: "servease-07762363-b4f31.firebasestorage.app",
  messagingSenderId: "940440952273",
  appId: "1:940440952273:web:59b502eced90274537d4f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

