import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { theme } from './config/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StockMapPage from './pages/StockMapPage';
import StockPage from './pages/StockPage';
import CompliancePage from './pages/CompliancePage';
import ReorderPage from './pages/ReorderPage';
import SuppliersPage from './pages/SuppliersPage';
import ConsignmentsPage from './pages/ConsignmentsPage';
import ImpactAnalyticsPage from './pages/ImpactAnalyticsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/stock-map"
        element={
          <PrivateRoute>
            <StockMapPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <PrivateRoute>
            <StockPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/consignments"
        element={
          <PrivateRoute>
            <ConsignmentsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <PrivateRoute>
            <CompliancePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reorder"
        element={
          <PrivateRoute>
            <ReorderPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <PrivateRoute>
            <SuppliersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/impact"
        element={
          <PrivateRoute>
            <ImpactAnalyticsPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '10px', fontSize: '14px' },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
