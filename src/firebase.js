import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDkStdF3cISspSvaM6n9MCs3K_fgXm3g-4",
    authDomain: "gymmanager-4c352.firebaseapp.com",
    projectId: "gymmanager-4c352",
    storageBucket: "gymmanager-4c352.appspot.com",
    messagingSenderId: "56940277686",
    appId: "1:56940277686:web:22146ce1af15006e9a9b17",
    measurementId: "G-RZPRKLYBM1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };
