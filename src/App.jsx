import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import './i18n';

// Components
import Navbar from './components/layout/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

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

import ProtectedRoute from './components/ProtectedRoute';

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
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
        <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
        <Route path="/signup" element={<ErrorBoundary><Signup /></ErrorBoundary>} />
        <Route path="/verify/:certId" element={<ErrorBoundary><VerifyCertificate /></ErrorBoundary>} />
      </Route>

      {/* Volunteer Routes using VolunteerLayout */}
      <Route element={<ProtectedRoute role="volunteer"><VolunteerLayout /></ProtectedRoute>}>
        <Route path="/volunteer/dashboard" element={<ErrorBoundary><VolunteerDashboard /></ErrorBoundary>} />
        <Route path="/volunteer/tasks" element={<ErrorBoundary><Tasks /></ErrorBoundary>} />
        <Route path="/volunteer/badges" element={<ErrorBoundary><Badges /></ErrorBoundary>} />
        <Route path="/volunteer/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
        <Route path="/volunteer/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
      </Route>

      {/* NGO Routes using specialized NGOLayout */}
      <Route element={<ProtectedRoute role="ngo"><NGOLayout /></ProtectedRoute>}>
        <Route path="/ngo/dashboard" element={<ErrorBoundary><NGODashboard /></ErrorBoundary>} />
        <Route path="/ngo/submit" element={<ErrorBoundary><SubmitNeed /></ErrorBoundary>} />
        <Route path="/ngo/volunteers" element={<ErrorBoundary><MatchedVolunteers /></ErrorBoundary>} />
        <Route path="/ngo/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
        <Route path="/ngo/report" element={<ErrorBoundary><ImpactReport /></ErrorBoundary>} />
        <Route path="/ngo/settings" element={<ErrorBoundary><div className="p-8 text-white">Settings Placeholder</div></ErrorBoundary>} />
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
