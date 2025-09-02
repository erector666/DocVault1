import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import SplashScreen from '../components/splash/SplashScreen';
import Layout from '../components/layout/Layout';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const CategoryView = React.lazy(() => import('../pages/CategoryView'));
const DocumentView = React.lazy(() => import('../pages/DocumentView'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

// Auth pages
const Login = React.lazy(() => import('../components/auth/Login'));
const Register = React.lazy(() => import('../components/auth/Register'));
const ForgotPassword = React.lazy(() => import('../components/auth/ForgotPassword'));

// TestSprite Integration Testing (Development Only)
const TestSpriteRunner = React.lazy(() => import('../tests/TestSpriteRunner'));

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

const AppRoutes: React.FC = () => {
  const { currentUser } = useSupabaseAuth();

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={!currentUser ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
        <Route path="/splash" element={<SplashScreen />} />
        
        {/* TestSprite Integration Testing Route (Development Only) */}
        <Route 
          path="/testsprite" 
          element={
            process.env.NODE_ENV === 'development' ? (
              <TestSpriteRunner />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/category/:categoryName" 
          element={
            <ProtectedRoute>
              <Layout>
                <CategoryView />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/document/:documentId" 
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentView />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
