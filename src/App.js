// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/Login/Login';
import FormContainer from './components/UserDetailsForm/FormContainer';
import UserLandingPage from './components/LandingPages/UserLandingPage';
import AdminLandingPage from './components/LandingPages/AdminLandingPage';
import './App.css';
import './styles/form.css';

function App() {
  const isAuthenticated = localStorage.getItem('user');
  return (
    <Router>
        <Routes>
          <Route exact path="/" element={<LoginPage />} />
          <Route path="/form" element={<FormContainer />} />
          <Route path="/dashboard" element={<Navigate to="/form" />} />
          <Route path="/login" element={<LoginPage />} />
        {/* Protect the landing pages */}
        <Route
          path="/user"
          element={isAuthenticated ? <UserLandingPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminLandingPage /> : <Navigate to="/login" />}
        />
        {/* Redirect root to login */}
        <Route path="*" element={<Navigate to="/login" />} />
        </Routes>

    </Router>
  );
}

export default App;
