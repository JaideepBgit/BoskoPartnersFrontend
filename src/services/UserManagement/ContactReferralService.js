/**
 * Contact Referral Service
 * Handles API calls for contact referral management
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fetch all contact referrals
 */
export const fetchContactReferrals = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/contact-referrals`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching contact referrals:', error);
        throw error;
    }
};

/**
 * Approve a contact referral and create user/organization
 * @param {number} referralId - The ID of the referral to approve
 * @param {object} approvalData - Approval configuration
 */
export const approveContactReferral = async (referralId, approvalData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contact-referrals/${referralId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(approvalData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error approving contact referral:', error);
        throw error;
    }
};

/**
 * Reject and delete a contact referral
 * @param {number} referralId - The ID of the referral to reject
 */
export const rejectContactReferral = async (referralId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contact-referrals/${referralId}/reject`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error rejecting contact referral:', error);
        throw error;
    }
};

/**
 * Update an existing contact referral
 * @param {number} referralId - The ID of the referral to update
 * @param {object} updateData - Updated contact information
 */
export const updateContactReferral = async (referralId, updateData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contact-referrals/${referralId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating contact referral:', error);
        throw error;
    }
};

/**
 * Search organizations with fuzzy matching
 * @param {string} query - The search query
 * @param {number} limit - Maximum number of results (default 10)
 * @returns {object} Object containing matched organizations with scores
 */
export const searchOrganizations = async (query, limit = 10) => {
    try {
        const params = new URLSearchParams({
            q: query || '',
            limit: limit.toString()
        });

        const response = await fetch(`${API_BASE_URL}/organizations/search?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching organizations:', error);
        throw error;
    }
};

/**
 * Check if an organization exists by name
 * @param {string} organizationName - The name of the organization to check
 */
export const checkOrganizationExists = async (organizationName) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contact-referrals/check-organization`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ organization_name: organizationName }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking organization:', error);
        throw error;
    }
};

/**
 * Check if an email exists in contact referrals or users table
 * @param {string} email - The email to check
 */
export const checkEmailExists = async (email) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contact-referrals/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking email:', error);
        throw error;
    }
};

/**
 * Generate a referral invite link for the current user.
 * If the user already has an active link, it returns the existing one.
 * @param {number} userId - The ID of the user generating the link
 * @returns {object} Object containing referral_code and link details
 */
export const generateReferralLink = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/referral-links/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error generating referral link:', error);
        throw error;
    }
};

/**
 * Validate a referral code and get the referring user's info.
 * @param {string} code - The referral code from the URL
 * @returns {object} Object containing validity status and referring user info
 */
export const validateReferralCode = async (code) => {
    try {
        const response = await fetch(`${API_BASE_URL}/referral-links/validate/${code}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return { valid: false, message: 'Invalid or expired referral link' };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error validating referral code:', error);
        throw error;
    }
};

/**
 * Format phone number with country code
 * @param {string} phone - The phone number
 * @param {string} countryCode - The country code (e.g., '+1', '+254')
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, countryCode = '') => {
    if (!phone) return '';

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If phone already starts with +, return as is
    if (cleaned.startsWith('+')) {
        return cleaned;
    }

    // If country code provided and phone doesn't have it, add it
    if (countryCode && !cleaned.startsWith(countryCode.replace('+', ''))) {
        // Remove leading zeros from phone number
        cleaned = cleaned.replace(/^0+/, '');
        return `${countryCode}${cleaned}`;
    }

    return cleaned;
};
