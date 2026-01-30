
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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
const db = getFirestore(app);

async function listAndUpdate() {
    console.log("Fetching tenants...");
    const querySnapshot = await getDocs(collection(db, "tenants"));

    if (querySnapshot.empty) {
        console.log("No tenants found.");
        return;
    }

    console.log(`Found ${querySnapshot.size} tenants.`);

    for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        console.log(`ID: ${docSnap.id} | Email: ${data.email} | Status: ${data.subscriptionStatus} | Active: ${data.active}`);

        // Update logic: If status is not active, set it to active
        if (data.subscriptionStatus !== 'active') {
            console.log(`Updating ${data.email} to ACTIVE...`);
            await updateDoc(doc(db, "tenants", docSnap.id), {
                subscriptionStatus: 'active',
                active: true
            });
            console.log("Update success!");
        } else {
            console.log("Already active.");
        }
    }
    process.exit(0);
}

listAndUpdate().catch(console.error);
