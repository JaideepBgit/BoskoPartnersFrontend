// App.js
import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/Login/Login';
import RoleSelectionPage from './components/Login/RoleSelectionPage';
import FormContainer from './components/UserDetailsForm/FormContainer';
import UserLandingPage from './components/LandingPages/UserLandingPage';
import UserDashboard from './components/Dashboard/UserDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import RootDashboard from './components/Dashboard/RootDashboard';
import ManagerDashboard from './components/Dashboard/ManagerDashboard';
import AssociationDashboard from './components/Dashboard/AssociationDashboard';
import InventoryPage from './components/Admin/Inventory/InventoryPage';
import BlankSurveyBuilderPage from './components/Admin/Inventory/BlankSurveyBuilderPage';
import UseTemplateSurveyBuilderPage from './components/Admin/Inventory/UseTemplateSurveyBuilderPage';
import UploadSurveyDocumentPage from './components/Admin/Inventory/UploadSurveyDocumentPage';
import UserManagementMain from './components/UserManagement/UserManagementMain';
import SurveysPage from './components/Surveys/SurveysPage';
import SurveyIntro from './components/Survey/SurveyIntro';
import SurveyOverview from './components/Survey/SurveyOverview';
import SurveyTaking from './components/Survey/SurveyTaking';
import ReportBuilder from './components/Admin/Reports/ReportBuilder';
import ReportsPage from './components/Admin/Reports/ReportsPage';
import VisualReportBuilder from './components/Admin/Reports/VisualReportBuilder';
import ReportDocumentEditor from './components/Admin/Reports/ReportDocumentEditor';
import AdminUserReports from './components/Admin/Reports/UserReports';
import RoleBasedReports from './components/Reports/RoleBasedReports';
import ContactReferralPage from './components/LandingPages/ContactReferralPage';
import ContactReferralPageV2 from './components/LandingPages/ContactReferralPageV2';
import ForgotPassword from './components/Login/ForgotPassword';
import ResetPassword from './components/Login/ResetPassword';
import SettingsPage from './components/Settings/SettingsPage';
import AdminProfilePage from './components/Settings/AdminProfilePage';
import OrganizationManagementPage from './components/Admin/OrganizationManagement/OrganizationManagementPage';
import AssociationsPage from './components/Admin/OrganizationManagement/AssociationsPage';
import OrganizationDetailPage from './components/Admin/OrganizationManagement/OrganizationDetailPage';
import AssociationDetailPage from './components/Admin/OrganizationManagement/AssociationDetailPage';
import SurveyDetailPage from './components/Admin/OrganizationManagement/SurveyDetailPage';
import UserDetailPage from './components/Admin/OrganizationManagement/UserDetailPage';
import AddUserPage from './components/UserManagement/Users/AddUserPage';
import ContactReferralsPage from './components/UserManagement/Users/ContactReferralsPage';
import AddOrganizationPage from './components/UserManagement/Organizations/AddOrganizationPage';
import AddAssociationPage from './components/Admin/OrganizationManagement/AddAssociationPage';
import EmailTemplatesPage from './components/Admin/Inventory/EmailTemplatesPage';
import AudienceManagement from './components/Admin/Audience/AudienceManagement';
import CreateAudiencePage from './components/Admin/Audience/CreateAudiencePage';
import AssociationOrganizationsPage from './components/Association/AssociationOrganizationsPage';
import AssociationUsersPage from './components/Association/AssociationUsersPage';
import AssociationSurveysPage from './components/Association/AssociationSurveysPage';
import AssociationUserReports from './components/Association/AssociationUserReports';

import './App.css';
import './styles/form.css';

// Role-based dashboard component
function RoleBasedDashboard() {
  const userRole = localStorage.getItem('userRole');
  const location = useLocation();

  // Root and Admin users: Show AdminDashboard for both /home and /dashboard
  // This consolidates the redundant routes into a single dashboard experience
  if (userRole === 'root' || userRole === 'admin') {
    return <AdminDashboard />;
  }

  if (userRole === 'manager') {
    return <Navigate to="/manager-dashboard" replace />;
  }

  if (userRole === 'association') {
    return <Navigate to="/association-dashboard" replace />;
  }

  // For regular users on /dashboard, redirect to their profile
  if (userRole === 'user' && location.pathname === '/dashboard') {
    return <Navigate to="/profile" replace />;
  }

  // For regular users, show UserDashboard on /home or /profile
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
    <ThemeProvider theme={theme}>
      <Router>
        <Main
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          login={login}
          logout={logout}
        />
      </Router>
    </ThemeProvider>
  );
}

function Main({ isAuthenticated, userRole, login, logout }) {
  const location = useLocation();

  // Debug logging
  console.log('📍 Current path:', location.pathname);
  console.log('🔐 Is authenticated:', isAuthenticated);

  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage onLogin={login} />} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route path="/select-role" element={<RoleSelectionPage onLogin={login} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* V2 Contact Referral Page - must be before v1 routes */}
        <Route path="/contact-referral/v2/:referralCode" element={<ContactReferralPageV2 />} />
        {/* Public Contact Referral Page - No authentication required */}
        <Route path="/contact-referral" element={
          <div style={{ padding: '20px' }}>
            <ContactReferralPage />
          </div>
        } />
        {/* Public Contact Referral Page with referral code */}
        <Route path="/contact-referral/:referralCode" element={
          <div style={{ padding: '20px' }}>
            <ContactReferralPage />
          </div>
        } />
        <Route path="/form" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <FormContainer onLogout={logout} />
          </ProtectedRoute>
        } />
        {/* /home route commented out - using /dashboard only
        <Route path="/home" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RoleBasedDashboard />
          </ProtectedRoute>
        } />
        */}
        <Route path="/dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RoleBasedDashboard />
          </ProtectedRoute>
        } />

        {/* Manager Dashboard Route */}
        <Route path="/manager-dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ManagerDashboard onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Association Dashboard Route */}
        <Route path="/association-dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AssociationDashboard onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Association Organizations Route */}
        <Route path="/association-organizations" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AssociationOrganizationsPage onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Association Users Route */}
        <Route path="/association-users" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AssociationUsersPage onLogout={logout} />
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
            <AdminDashboard onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* User Profile Route - for user details management */}
        <Route path="/profile" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserDashboard onLogout={logout} />
          </ProtectedRoute>
        } />
        
        {/* Inventory Route - Admin/Root/Manager */}
        <Route path="/inventory" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <InventoryPage />
          </ProtectedRoute>
        } />

        {/* Association Inventory Route */}
        <Route path="/association-inventory" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AssociationSurveysPage onLogout={logout} />
          </ProtectedRoute>
        } />
        <Route path="/inventory/blank-survey" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <BlankSurveyBuilderPage />
          </ProtectedRoute>
        } />
        <Route path="/inventory/use-template" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UseTemplateSurveyBuilderPage />
          </ProtectedRoute>
        } />
        <Route path="/inventory/upload-document" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UploadSurveyDocumentPage />
          </ProtectedRoute>
        } />

        {/* Root Dashboard Route */}
        <Route path="/root-dashboard" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RootDashboard onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* User Management Route */}
        <Route path="/users" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserManagementMain onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* User Detail Page - Individual user from users list */}
        <Route path="/users/:userId" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserDetailPage onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Add User Page Route */}
        <Route path="/users/add" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AddUserPage />
          </ProtectedRoute>
        } />

        {/* Contact Referrals Page Route */}
        <Route path="/contact-referrals" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ContactReferralsPage />
          </ProtectedRoute>
        } />

        {/* Email Templates Page Route */}
        <Route path="/email-templates" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <EmailTemplatesPage />
          </ProtectedRoute>
        } />

        {/* Audience Management Route */}
        <Route path="/audiences" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AudienceManagement />
          </ProtectedRoute>
        } />
        
        {/* Create Audience Route */}
        <Route path="/audiences/create" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <CreateAudiencePage />
          </ProtectedRoute>
        } />
        
        {/* Edit Audience Route */}
        <Route path="/audiences/edit/:id" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <CreateAudiencePage />
          </ProtectedRoute>
        } />


        {/* Surveys Route */}
        <Route path="/surveys" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveysPage onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Survey Intro Route - First Screen */}
        <Route path="/survey/intro" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveyIntro onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Survey Overview Route - Second Screen */}
        <Route path="/survey/overview" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveyOverview onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Survey Taking Route - Third Screen (Actual Survey) */}
        <Route path="/survey/taking" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveyTaking onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Legacy Survey Route - Redirect to intro */}
        <Route path="/survey" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveyIntro onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Reports Route - Role-based 
        <Route path="/reports" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <RoleBasedReports onLogout={logout} />
          </ProtectedRoute>
        } />*/}

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

        {/* Document Editor Route */}
        <Route path="/document-editor" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ReportDocumentEditor onClose={() => window.history.back()} />
          </ProtectedRoute>
        } />

        {/* Admin User Reports Route */}
        <Route path="/user-reports" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminUserReports onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Association User Reports Route */}
        <Route path="/association-user-reports" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AssociationUserReports onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Organization Management Routes */}
        <Route path="/organization-management" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <OrganizationManagementPage onLogout={logout} />
          </ProtectedRoute>
        } />
        {/* Associations Management Page */}
        <Route path="/associations" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AssociationsPage />
          </ProtectedRoute>
        } />
        {/* Association Detail Page */}
        <Route path="/association-management/:id" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AssociationDetailPage onLogout={logout} />
          </ProtectedRoute>
        } />
        <Route path="/organization-management/:id" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <OrganizationDetailPage onLogout={logout} />
          </ProtectedRoute>
        } />
        {/* Survey Detail Page - Individual survey within an organization */}
        <Route path="/organization-management/:orgId/surveys/:surveyId" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SurveyDetailPage onLogout={logout} />
          </ProtectedRoute>
        } />
        {/* User Detail Page - Individual user within an organization */}
        <Route path="/organization-management/:orgId/users/:userId" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UserDetailPage onLogout={logout} />
          </ProtectedRoute>
        } />
        <Route path="/organizations" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <OrganizationManagementPage onLogout={logout} />
          </ProtectedRoute>
        } />

        {/* Add Organization Page Route */}
        <Route path="/organizations/add" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AddOrganizationPage />
          </ProtectedRoute>
        } />

        {/* Edit Organization Page Route */}
        <Route path="/organizations/edit/:id" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AddOrganizationPage />
          </ProtectedRoute>
        } />

        {/* Add Association Page Route */}
        <Route path="/associations/add" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AddAssociationPage />
          </ProtectedRoute>
        } />

        {/* Admin/Root/Manager Profile Route */}
        <Route path="/admin-profile" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminProfilePage />
          </ProtectedRoute>
        } />

        {/* Settings Route */}
        <Route path="/settings" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SettingsPage onLogout={logout} />
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
