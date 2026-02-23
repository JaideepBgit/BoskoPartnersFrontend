import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Check if an email already has an account.
 * Returns { exists: true/false }
 */
const checkEmail = async (email) => {
  const response = await axios.post(`${BASE_URL}/auth/check-email`, { email });
  return response.data;
};

/**
 * Create a new account (email + password).
 * Returns the new user object including id, role, survey_code.
 */
const createAccount = async ({ email, password }) => {
  const response = await axios.post(`${BASE_URL}/auth/signup`, { email, password });
  return response.data;
};

/**
 * Sign in an existing user.
 * Returns the user object on success.
 */
const signIn = async ({ email, password }) => {
  const response = await axios.post(`${BASE_URL}/users/login`, {
    username: email,
    password,
  });
  return response.data;
};

// ── Onboarding profile endpoints ─────────────────────────────────────────────

/**
 * Save onboarding progress (upsert).
 * @param {number} userId
 * @param {number} step  - current step number (1-5)
 * @param {object} data  - partial profile data for this step
 */
const saveOnboardingStep = async (userId, step, data) => {
  const response = await axios.post(`${BASE_URL}/user-profiles/save`, {
    user_id: userId,
    onboarding_step: step,
    ...data,
  });
  return response.data;
};

/**
 * Save Step 2 org affiliations (replaces all existing for this user).
 * @param {number} userId
 * @param {Array}  affiliations - [{ organization_id, affiliation_type }]
 */
const saveOrgAffiliations = async (userId, affiliations) => {
  const response = await axios.post(`${BASE_URL}/user-profiles/affiliations`, {
    user_id: userId,
    affiliations,
  });
  return response.data;
};

/**
 * Mark onboarding as complete.
 * @param {number} userId
 */
const completeOnboarding = async (userId) => {
  const response = await axios.post(`${BASE_URL}/user-profiles/complete`, {
    user_id: userId,
  });
  return response.data;
};

/**
 * Get current onboarding profile (to resume).
 * @param {number} userId
 */
const getOnboardingProfile = async (userId) => {
  const response = await axios.get(`${BASE_URL}/user-profiles/${userId}`);
  return response.data;
};

const SignUpService = {
  checkEmail,
  createAccount,
  signIn,
  saveOnboardingStep,
  saveOrgAffiliations,
  completeOnboarding,
  getOnboardingProfile,
};

export default SignUpService;
