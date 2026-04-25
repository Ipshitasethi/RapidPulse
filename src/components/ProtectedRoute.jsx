import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wrapper that restricts route access by authentication and role.
 * Shows a loading spinner while auth/role is being resolved.
 */
export default function ProtectedRoute({ children, role }) {
  const { currentUser, userRole, loading } = useAuth();

  // Still initializing auth
  if (loading) return null;

  // Not logged in at all
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Logged in but role not yet fetched from Firestore — show a spinner to avoid
  // redirecting to /signup during the async Firestore read that happens after login.
  if (!userRole) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#6C47FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#A0A0B8] text-sm animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Wrong role — redirect to correct dashboard
  if (role && userRole !== role) {
    return <Navigate to={userRole === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard'} />;
  }

  return children;
}
