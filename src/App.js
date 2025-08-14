// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/Login/Login';
import FormContainer from './components/UserDetailsForm/FormContainer';
import UserLandingPage from './components/LandingPages/UserLandingPage';
import AdminLandingPage from './components/LandingPages/AdminLandingPage';
import UserDashboard from './components/Dashboard/UserDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import InventoryPage from './components/Admin/Inventory/InventoryPage';
import UserManagementMain from './components/UserManagement/UserManagementMain';
import SurveysPage from './components/Surveys/SurveysPage';
import SurveyTaking from './components/Survey/SurveyTaking';
import ReportBuilder from './components/Admin/Reports/ReportBuilder';
import ReportsPage from './components/Admin/Reports/ReportsPage';
import VisualReportBuilder from './components/Admin/Reports/VisualReportBuilder';

import './App.css';
import './styles/form.css';

// Role-based dashboard component
function RoleBasedDashboard() {
  const userRole = localStorage.getItem('userRole');
  const location = useLocation();
  
  if (userRole === 'admin') {
    // If admin is on /home route, show AdminLandingPage
    if (location.pathname === '/home') {
      return <AdminLandingPage />;
    }
    // If admin is on /dashboard route, show AdminDashboard
    if (location.pathname === '/dashboard') {
      return <AdminDashboard />;
    }
  }
  
  // For regular users on /dashboard, redirect to their profile
  if (userRole === 'user' && location.pathname === '/dashboard') {
    return <Navigate to="/profile" replace />;
  }
  
  // For regular users, show UserDashboard only on /home or /profile
  return <UserDashboard />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole');
  
  // Debug information
  console.log('App.js - Authentication status:', isAuthenticated);
  console.log('App.js - User role:', userRole);
  
  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };
  
  const logout = () => {
    console.log("Logging out from the website");
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
  };
  
  return (
    <Router>
      <Main 
        isAuthenticated={isAuthenticated} 
        userRole={userRole} 
        login={login} 
        logout={logout}
      />
    </Router>
  );
}

function Main({ isAuthenticated, userRole, login, logout }) {
  // const location = useLocation();
  // const isLoginPage = location.pathname === '/' || location.pathname === '/login';
  
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage onLogin={login} />} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route path="/form" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <FormContainer onLogout={logout} />
          </ProtectedRoute>
        } />
        <Route path="/home" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RoleBasedDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RoleBasedDashboard />
          </ProtectedRoute>
        } />
        
        {/* Protect the landing pages */}
        <Route path="/user" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserLandingPage onLogout={logout} />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminLandingPage onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* User Profile Route - for user details management */}
        <Route path="/profile" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserDashboard onLogout={logout} />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <InventoryPage />
          </ProtectedRoute>
        } />
        
        {/* User Management Route */}
        <Route path="/users" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserManagementMain onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* Surveys Route */}
        <Route path="/surveys" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveysPage onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* Survey Taking Route */}
        <Route path="/survey" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveyTaking onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* Reports Route */}
        <Route path="/reports" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ReportsPage onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* Report Builder Route */}
        <Route path="/reportbuilder" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ReportBuilder onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* Visual Report Builder Route */}
        <Route path="/visual-builder" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <VisualReportBuilder onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* Redirect root to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, children }) {
  console.log('🔒 ProtectedRoute - isAuthenticated:', isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default App;
