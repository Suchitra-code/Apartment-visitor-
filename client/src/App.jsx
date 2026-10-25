import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './layouts/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import GuardDashboard from './pages/guard/GuardDashboard';

// Modules
import VisitorManagerPage from './pages/visitors/VisitorManagerPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import NoticeBoardPage from './pages/notices/NoticeBoardPage';
import FlatManagerPage from './pages/admin/FlatManagerPage';
import StaffManagerPage from './pages/admin/StaffManagerPage';
import ReportsPage from './pages/admin/ReportsPage';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-rose-600">403 – Access Forbidden</h2>
          <p className="text-xs text-slate-500">Your role ({user.role}) does not have permission to access this page.</p>
          <a href={`/${user.role}/dashboard`} className="text-xs text-indigo-600 font-bold underline">
            Return to your dashboard
          </a>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Role-Specific Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute allowedRoles={['resident', 'admin']}>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guard/dashboard"
        element={
          <ProtectedRoute allowedRoles={['guard', 'admin']}>
            <GuardDashboard />
          </ProtectedRoute>
        }
      />

      {/* Shared Modules */}
      <Route
        path="/visitors"
        element={
          <ProtectedRoute allowedRoles={['admin', 'resident', 'guard']}>
            <VisitorManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute allowedRoles={['admin', 'resident']}>
            <MaintenancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notices"
        element={
          <ProtectedRoute allowedRoles={['admin', 'resident', 'guard']}>
            <NoticeBoardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Operations */}
      <Route
        path="/admin/flats"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FlatManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <StaffManagerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 Route */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">404</h2>
              <p className="text-sm text-slate-500">The requested page could not be found.</p>
              <a href="/" className="text-xs text-indigo-600 font-bold underline">
                Return to home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
