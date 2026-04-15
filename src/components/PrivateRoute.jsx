import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute({ children, roleRequired }) {
    const { user, loading, accessDenied, trialExpired, paymentOverdue, requiresPasswordChange, termsAccepted } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (paymentOverdue) {
        return <Navigate to="/payment-required" />;
    }

    if (trialExpired && location.pathname !== '/app/subscription') {
        return <Navigate to="/trial-expired" />;
    }

    if (accessDenied) {
        return <Navigate to="/access-denied" />;
    }

    // Check for Terms Acceptance (Highest Priority after Payment?)
    // Actually, usually Legal > Payment. You can't pay if you don't agree.
    if (!termsAccepted && location.pathname !== '/terms') {
        return <Navigate to="/terms" />;
    }

    // Check if password change is required
    // Ensure we don't redirect if we are already ON the change-password page
    if (requiresPasswordChange && window.location.pathname !== '/change-password') {
        return <Navigate to="/change-password" />;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // Role Based Access Control
    if (user.role === 'student' && location.pathname.startsWith('/app')) {
        return <Navigate to="/student" />;
    }

    if (user.role !== 'student' && location.pathname.startsWith('/student')) {
        return <Navigate to="/app" />;
    }

    if (roleRequired && user.role && user.role !== roleRequired) {
        // Redirect to dashboard if trying to access restricted area
        const target = user.role === 'student' ? '/student' : '/app';
        return <Navigate to={target} />;
    }

    return children;
}
