import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Check Firestore for tenant status
                try {
                    const tenantRef = doc(db, 'tenants', currentUser.uid);
                    const tenantSnap = await getDoc(tenantRef);

                    if (tenantSnap.exists()) {
                        const data = tenantSnap.data();

                        // Check Access
                        if (data.active === false) {
                            setAccessDenied(true);
                        } else {
                            setAccessDenied(false);
                        }

                        // Check Password Change Requirement
                        if (data.requiresPasswordChange === true) {
                            setRequiresPasswordChange(true);
                        } else {
                            setRequiresPasswordChange(false);
                        }

                    } else {
                        // Initialize new tenant as active AND requiring password change
                        await setDoc(tenantRef, {
                            active: true,
                            requiresPasswordChange: true, // Force change on first login
                            email: currentUser.email,
                            createdAt: new Date().toISOString()
                        });
                        setAccessDenied(false);
                        setRequiresPasswordChange(true);
                    }
                } catch (error) {
                    console.error("Error checking tenant status:", error);
                    // Fallback to allow access if DB fails, or block? 
                    // Let's allow but log error. Or maybe safer to default deny?
                    // For now, default allow to prevent lockout during bugs.
                    setAccessDenied(false);
                    setRequiresPasswordChange(false);
                }
            } else {
                setAccessDenied(false);
                setRequiresPasswordChange(false);
            }

            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setAccessDenied(false);
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const value = {
        user,
        loading,
        accessDenied,
        requiresPasswordChange,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
