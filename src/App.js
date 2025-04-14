// App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/Login/Login';
import UserLandingPage from './components/LandingPages/UserLandingPage';
import AdminLandingPage from './components/LandingPages/AdminLandingPage';

function App() {
  const isAuthenticated = localStorage.getItem('user');

  return (
    <BrowserRouter>
      <Routes>
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
    </BrowserRouter>
  );
}

export default App;
