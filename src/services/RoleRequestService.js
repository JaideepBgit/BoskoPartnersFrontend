import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Submit a role request
 */
const createRoleRequest = async (userId, roleId, organizationId, reason = '') => {
  const response = await axios.post(`${BASE_URL}/role-requests`, {
    user_id: userId,
    role_id: roleId,
    organization_id: organizationId,
    reason,
  });
  return response.data;
};

/**
 * Get role requests with optional filters
 */
const getRoleRequests = async (params = {}) => {
  const response = await axios.get(`${BASE_URL}/role-requests`, { params });
  return response.data;
};

/**
 * Approve or deny a role request
 */
const reviewRoleRequest = async (requestId, action, reviewedBy, reviewNote = '') => {
  const response = await axios.put(`${BASE_URL}/role-requests/${requestId}/review`, {
    action,
    reviewed_by: reviewedBy,
    review_note: reviewNote,
  });
  return response.data;
};

/**
 * Get count of pending role requests
 */
const getPendingCount = async () => {
  const response = await axios.get(`${BASE_URL}/role-requests/pending-count`);
  return response.data;
};

/**
 * Get all roles (for role selection dropdown)
 */
const getAllRoles = async () => {
  const response = await axios.get(`${BASE_URL}/roles`);
  return response.data;
};

/**
 * Get all organizations (for org selection dropdown)
 */
const getAllOrganizations = async () => {
  const response = await axios.get(`${BASE_URL}/organizations`);
  return response.data;
};

const RoleRequestService = {
  createRoleRequest,
  getRoleRequests,
  reviewRoleRequest,
  getPendingCount,
  getAllRoles,
  getAllOrganizations,
};

export default RoleRequestService;
