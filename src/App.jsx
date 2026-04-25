import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import './i18n';

// Components
import Navbar from './components/layout/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NGODashboard from './pages/ngo/Dashboard';
import SubmitNeed from './pages/ngo/SubmitNeed';
import MatchedVolunteers from './pages/ngo/MatchedVolunteers';
import Analytics from './pages/ngo/Analytics';
import ImpactReport from './pages/ngo/ImpactReport';
import VolunteerDashboard from './pages/volunteer/Dashboard';
import Tasks from './pages/volunteer/Tasks';
import Badges from './pages/volunteer/Badges';
import Leaderboard from './pages/volunteer/Leaderboard';
import Profile from './pages/volunteer/Profile';
import VerifyCertificate from './pages/VerifyCertificate';

// Protected Route Wrapper
const ProtectedRoute = ({ children, role }) => {
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
};

import NGOLayout from './layouts/NGOLayout';
import VolunteerLayout from './layouts/VolunteerLayout';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => (
  <div className="pt-24 min-h-screen">
    <Navbar />
    <Outlet />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public and Volunteer Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify/:certId" element={<VerifyCertificate />} />

      </Route>

      {/* Volunteer Routes using VolunteerLayout */}
      <Route element={<ProtectedRoute role="volunteer"><VolunteerLayout /></ProtectedRoute>}>
        <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        <Route path="/volunteer/tasks" element={<Tasks />} />
        <Route path="/volunteer/badges" element={<Badges />} />
        <Route path="/volunteer/leaderboard" element={<Leaderboard />} />
        <Route path="/volunteer/profile" element={<Profile />} />
      </Route>

      {/* NGO Routes using specialized NGOLayout */}
      <Route element={<ProtectedRoute role="ngo"><NGOLayout /></ProtectedRoute>}>
        <Route path="/ngo/dashboard" element={<NGODashboard />} />
        <Route path="/ngo/submit" element={<SubmitNeed />} />
        <Route path="/ngo/volunteers" element={<MatchedVolunteers />} />
        <Route path="/ngo/analytics" element={<Analytics />} />
        <Route path="/ngo/report" element={<ImpactReport />} />
        <Route path="/ngo/settings" element={<div className="p-8 text-white">Settings Placeholder</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
