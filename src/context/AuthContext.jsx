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
    const [paymentOverdue, setPaymentOverdue] = useState(false);
    const [gracePeriodDaysRemaining, setGracePeriodDaysRemaining] = useState(null); // New State
    const [trialInfo, setTrialInfo] = useState({ isTrial: false, daysRemaining: 0, totalDays: 0 });
    const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(true); // Default true to avoid flash, but check logic below

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // 1. Determine Role & Tenant
                    const SUPER_ADMINS = ['j.17jvictor@gmail.com'];
                    console.log('Checking Admin Access for:', currentUser.email);

                    if (SUPER_ADMINS.some(admin => admin.toLowerCase() === currentUser.email?.toLowerCase())) {
                        console.log('User is Super Admin!');
                        currentUser.isSuperAdmin = true;
                    } else {
                        console.log('User is NOT Super Admin');
                    }

                    let tenantId = currentUser.uid;
                    let role = 'owner';

                    // 1. Check if this user IS an Owner (has a tenant doc)
                    // This takes precedence over being a staff member elsewhere.
                    const ownTenantRef = doc(db, 'tenants', currentUser.uid);
                    const ownTenantSnap = await getDoc(ownTenantRef);

                    if (ownTenantSnap.exists()) {
                        console.log('User is an Owner (Tenant found). Skipping staff check.');
                        // role stays 'owner'
                        // tenantId stays currentUser.uid
                    } else {
                        // 2. Not an owner, check if is STAFF
                        const emailKey = currentUser.email.toLowerCase().replace(/\./g, '_');
                        const staffRef = doc(db, 'staff_access', emailKey);
                        const staffSnap = await getDoc(staffRef);

                        if (staffSnap.exists()) {
                            const staffData = staffSnap.data();
                            console.log('Staff Access Found:', staffData);

                            if (staffData.blocked) {
                                setAccessDenied(true);
                                setLoading(false);
                                return;
                            }

                            if (staffData.gymOwnerId) {
                                tenantId = staffData.gymOwnerId;
                                role = staffData.role || 'staff';
                            }
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
                        // Manual Block takes precedence over everything
                        if (data.active === false) {
                            setAccessDenied(true);
                            // Ensure we reset other states
                            setTrialExpired(false);
                        } else {
                            // Check Trial Status of the GYM
                            const subscriptionStatus = data.subscriptionStatus;
                            let isSubscriber = false;

                            // 1. LIFETIME ACCESS CHECK (Prioridade Máxima)
                            // Se tiver acesso vitalício, ignora status do stripe, atrasos, etc.
                            if (data.lifetimeAccess === true) {
                                isSubscriber = true;
                                console.log('Access granted via Lifetime Access');
                            } else {
                                // Active, Trialing or missing status (legacy/free) grants access
                                isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === undefined;
                            }

                            // 1. LIFETIME ACCESS CHECK (Prioridade Máxima)
                            // Se tiver acesso vitalício, ignora status do stripe, atrasos, etc.
                            if (data.lifetimeAccess === true) {
                                isSubscriber = true;
                                console.log('Access granted via Lifetime Access');
                            } else {
                                // Active, Trialing or missing status (legacy/free) grants access
                                isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === undefined;
                            }

                            // Check for Past Due with Grace Period (Only if not already valid via lifetime)
                            if (!data.lifetimeAccess && subscriptionStatus === 'past_due') {
                                const currentPeriodEnd = data.current_period_end; // Timestamp from Firestore
                                if (currentPeriodEnd) {
                                    const endDate = currentPeriodEnd.toDate ? currentPeriodEnd.toDate() : new Date(currentPeriodEnd.seconds * 1000);
                                    const GRACE_PERIOD_DAYS = 5;

                                    const gracePeriodEnd = new Date(endDate);
                                    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

                                    const now = new Date();

                                    if (now <= gracePeriodEnd) {
                                        // Still within grace period
                                        isSubscriber = true;

                                        const timeRem = gracePeriodEnd - now;
                                        const daysRem = Math.ceil(timeRem / (1000 * 60 * 60 * 24));
                                        setGracePeriodDaysRemaining(daysRem);

                                        console.log('Access granted via Grace Period. Ends:', gracePeriodEnd);
                                    } else {
                                        // Grace period expired
                                        isSubscriber = false;
                                        setPaymentOverdue(true);
                                        setGracePeriodDaysRemaining(0);
                                        console.log('Grace Period Expired on:', gracePeriodEnd);
                                    }
                                } else {
                                    // If no period end date found, default to blocking or unsafe open?
                                    // Defaulting to block for safety if status is explicitly past_due
                                    isSubscriber = false;
                                    setPaymentOverdue(true);
                                }
                            } else {
                                // Reset payment overdue if active or other status (e.g. trial / active)
                                setPaymentOverdue(false);
                                setGracePeriodDaysRemaining(null);
                            }

                            // LOGIC FIX: If status is manually set to 'trial', we should NOT run the date check logic that blocks old users.
                            // The date check logic (lines below) only runs if !isSubscriber.
                            // By adding 'trial' to isSubscriber above, we bypass the block.
                            // BUT we still want to show the trial countdown if possible?
                            // For now, if admin sets 'trial', let's treat it as "Authorized Trial" (Unlimited or managed by admin)
                            // OR we can make the date check purely visual if isSubscriber is true? 
                            // Let's stick to simple: 'trial' status = Access Granted.

                            if (!isSubscriber && !paymentOverdue) {
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
                                    setAccessDenied(false); // Explicitly ensure false so PrivateRoute allows /app/subscription
                                    setTrialExpired(true);
                                } else {
                                    setTrialExpired(false);
                                    setAccessDenied(false);
                                }
                            } else if (isSubscriber) {
                                // If subscriber, clear all blocks
                                setTrialInfo({ isTrial: false, daysRemaining: 0, totalDays: 0 });
                                setTrialExpired(false);
                                setAccessDenied(false);
                                setPaymentOverdue(false);
                                setGracePeriodDaysRemaining(null);
                            } else {
                                // Fallback for blocked via payment overdue
                                setTrialExpired(false); // Ensure trial screen doesn't conflict
                            }

                            // Check Password Change Requirement
                            if (data.requiresPasswordChange) {
                                setRequiresPasswordChange(true);
                            } else {
                                setRequiresPasswordChange(false);
                            }

                            // Check Terms Acceptance
                            if (data.termsAccepted) {
                                setTermsAccepted(true);
                            } else {
                                setTermsAccepted(false);
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
                                subscriptionStatus: 'trial',
                                termsAccepted: false // New owners must accept terms
                            });
                            setTrialInfo({ isTrial: true, daysRemaining: 7, totalDays: 7 }); // Corrected initial trial
                            setAccessDenied(false);
                            setTrialExpired(false);
                            setTermsAccepted(false);
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
                setRequiresPasswordChange(false);
                setTermsAccepted(true);
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
        paymentOverdue,
        gracePeriodDaysRemaining, // Exported
        trialInfo,
        requiresPasswordChange,
        termsAccepted,
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
