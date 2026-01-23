import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [trialExpired, setTrialExpired] = useState(false);
    const [trialInfo, setTrialInfo] = useState({ isTrial: false, daysRemaining: 0, totalDays: 0 });
    const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // 1. Determine Role & Tenant
                    let tenantId = currentUser.uid;
                    let role = 'owner';

                    // Check if this user is a STAFF member of another gym
                    // We use the email as a key to look up in 'staff_access'
                    // Note: In a real prod app, use a Firebase Function or strict rules. 
                    // Here we assume standard read access or we use a hashed email path if privacy matters.
                    // For MVP simplicity: users/{currentUser.uid}/metadata/access_info OR global lookup.
                    // Let's try global lookup by email.

                    const emailKey = currentUser.email.replace(/\./g, '_'); // sanitize for doc ID
                    const staffRef = doc(db, 'staff_access', emailKey);
                    const staffSnap = await getDoc(staffRef);

                    if (staffSnap.exists()) {
                        const staffData = staffSnap.data();

                        // Access Control Check
                        if (staffData.blocked) {
                            setAccessDenied(true);
                            setLoading(false);
                            return; // Stop execution
                        }

                        if (staffData.gymOwnerId) {
                            tenantId = staffData.gymOwnerId;
                            role = staffData.role || 'staff';
                        }
                    }

                    // 2. Load Tenant Data (using tenantId)
                    const tenantRef = doc(db, 'tenants', tenantId);
                    const tenantSnap = await getDoc(tenantRef);

                    // If I am staff, I need to check if the OWNER's account is active
                    // But I also might have my own user status? 
                    // For simplicity: If owner is inactive, staff is locked out too.

                    if (tenantSnap.exists()) {
                        const data = tenantSnap.data();

                        // Check Access (Banned/Inactive) for the GYM
                        if (data.active === false) {
                            setAccessDenied(true);
                        } else {
                            // Check Trial Status of the GYM
                            const subscriptionStatus = data.subscriptionStatus;
                            const isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === undefined;

                            if (!isSubscriber) {
                                // Calculate days since creation of the GYM
                                const createdDate = new Date(data.createdAt);
                                const now = new Date();
                                const TRIAL_DAYS = 7;

                                const trialEndDate = new Date(createdDate);
                                trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

                                const timeRemaining = trialEndDate - now;
                                const daysLeft = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

                                setTrialInfo({
                                    isTrial: true,
                                    daysRemaining: daysLeft,
                                    totalDays: TRIAL_DAYS
                                });

                                if (daysLeft <= 0) {
                                    setAccessDenied(true);
                                    setTrialExpired(true);
                                } else {
                                    setTrialExpired(false);
                                    setAccessDenied(false);
                                }
                            } else {
                                setTrialInfo({ isTrial: false, daysRemaining: 0, totalDays: 0 });
                                setTrialExpired(false);
                                setAccessDenied(false);
                            }
                        }
                    } else {
                        // If tenant doc doesn't exist AND I am the owner, create it.
                        // If I am staff and owner doc missing, something is wrong, but default to safe.
                        if (role === 'owner') {
                            await setDoc(tenantRef, {
                                active: true,
                                email: currentUser.email,
                                createdAt: new Date().toISOString(),
                                subscriptionStatus: 'trial'
                            });
                            setTrialInfo({ isTrial: true, daysRemaining: 7, totalDays: 7 }); // Corrected initial trial
                            setAccessDenied(false);
                            setTrialExpired(false);
                        }
                    }

                    // Attach role and tenantId to user object for easy access
                    currentUser.role = role;
                    currentUser.tenantId = tenantId;

                } catch (error) {
                    console.error("Error checking tenant status:", error);
                    setAccessDenied(false);
                }
            } else {
                setAccessDenied(false);
                setTrialExpired(false);
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
        trialExpired,
        trialInfo,
        requiresPasswordChange,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#0f172a',
                    color: 'white'
                }}>
                    <Loader2 size={48} className="animate-spin" color="#10b981" />
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
