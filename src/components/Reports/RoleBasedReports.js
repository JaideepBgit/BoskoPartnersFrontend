import React from 'react';
import { useLocation } from 'react-router-dom';
import ReportsPage from '../Admin/Reports/ReportsPage';
import UserReports from './UserReports';

const RoleBasedReports = ({ onLogout }) => {
  const userRole = localStorage.getItem('userRole');
  
  // Route based on user role
  if (userRole === 'admin') {
    return <ReportsPage onLogout={onLogout} />;
  } else {
    return <UserReports onLogout={onLogout} />;
  }
};

export default RoleBasedReports;
