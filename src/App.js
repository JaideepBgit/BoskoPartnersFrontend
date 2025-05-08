// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/Login/Login';
import FormContainer from './components/UserDetailsForm/FormContainer';
import UserLandingPage from './components/LandingPages/UserLandingPage';
import AdminLandingPage from './components/LandingPages/AdminLandingPage';
import UserDashboard from './components/Dashboard/UserDashboard';
import InventoryPage from './components/Admin/Inventory/InventoryPage';
import UserManagementMain from './components/UserManagement/UserManagementMain';
import './App.css';
import './styles/form.css';

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
  const location = useLocation();
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';
  
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
        <Route path="/dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserDashboard />
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
        
        {/* Redirect root to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default App;
