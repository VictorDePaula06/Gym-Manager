import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute({ children, roleRequired }) {
    const { user, loading, accessDenied, trialExpired, requiresPasswordChange } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (trialExpired) {
        return <Navigate to="/trial-expired" />;
    }

    if (accessDenied) {
        return <Navigate to="/payment-required" />;
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
    if (roleRequired && user.role && user.role !== roleRequired) {
        // Redirect to dashboard if trying to access restricted area
        return <Navigate to="/app" />;
    }

    return children;
}
