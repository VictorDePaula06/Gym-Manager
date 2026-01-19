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
                // Check Firestore for tenant status
                try {
                    const tenantRef = doc(db, 'tenants', currentUser.uid);
                    const tenantSnap = await getDoc(tenantRef);

                    if (tenantSnap.exists()) {
                        const data = tenantSnap.data();

                        // Check Access (Banned/Inactive)
                        if (data.active === false) {
                            setAccessDenied(true);
                        } else {
                            // Check Trial Status
                            // Legacy users (undefined status) or Active status -> ALLOW
                            const subscriptionStatus = data.subscriptionStatus;
                            const isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === undefined;

                            if (!isSubscriber) {
                                // Must be in trial or explicitly expired
                                // Calculate days since creation
                                const createdDate = new Date(data.createdAt);
                                const now = new Date();

                                // TRIAL LIMIT SET TO 7 DAYS
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

                        // Check Password Change Requirement
                        if (data.requiresPasswordChange === true) {
                            setRequiresPasswordChange(true);
                        } else {
                            setRequiresPasswordChange(false);
                        }

                    } else {
                        // Initialize new tenant
                        await setDoc(tenantRef, {
                            active: true,
                            requiresPasswordChange: true, // Force change on first login
                            email: currentUser.email,
                            createdAt: new Date().toISOString(),
                            subscriptionStatus: 'trial' // Default new users to trial
                        });

                        setTrialInfo({
                            isTrial: true,
                            daysRemaining: 1, // Default 1 day for testing
                            totalDays: 1
                        });
                        setAccessDenied(false);
                        setTrialExpired(false);
                        setRequiresPasswordChange(true);
                    }
                } catch (error) {
                    console.error("Error checking tenant status:", error);
                    // Default allow to prevent lockout during bugs, but maybe log this
                    setAccessDenied(false);
                    setTrialExpired(false);
                    setRequiresPasswordChange(false);
                }
            } else {
                setAccessDenied(false);
                setTrialExpired(false);
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
