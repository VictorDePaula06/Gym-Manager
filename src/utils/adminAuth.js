
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

// Same config as main app
const firebaseConfig = {
    apiKey: "AIzaSyDkStdF3cISspSvaM6n9MCs3K_fgXm3g-4",
    authDomain: "gymmanager-4c352.firebaseapp.com",
    projectId: "gymmanager-4c352",
    storageBucket: "gymmanager-4c352.appspot.com",
    messagingSenderId: "56940277686",
    appId: "1:56940277686:web:22146ce1af15006e9a9b17",
    measurementId: "G-RZPRKLYBM1"
};

/**
 * Creates a new user in Firebase Auth without logging out the current user.
 * It does this by initializing a temporary secondary Firebase App instance.
 */
export const createTenantUser = async (email, password) => {
    let secondaryApp;
    try {
        // Initialize a secondary app with a unique name
        const appName = "secondaryApp";

        // Check if already exists to avoid duplicate error
        const apps = getApps();
        const existingApp = apps.find(app => app.name === appName);

        secondaryApp = existingApp || initializeApp(firebaseConfig, appName);

        const secondaryAuth = getAuth(secondaryApp);

        // Create the user on the secondary auth instance
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUser = userCredential.user;

        // Immediately sign out from the secondary app so it doesn't interfere
        await signOut(secondaryAuth);

        return newUser;
    } catch (error) {
        console.error("Error creating tenant user:", error);
        throw error; // Re-throw to be handled by UI
    }
    // Note: We don't delete the app because Firebase JS SDK doesn't fully support deleting apps cleanly in all envs without reload, 
    // but reusing it is fine.
};
