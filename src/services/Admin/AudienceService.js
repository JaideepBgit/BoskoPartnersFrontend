// ============================================================================
// AUDIENCE SERVICE - Frontend API Client
// ============================================================================
// Service for managing audiences and sending targeted reminders
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AudienceService {
  // ==========================================================================
  // AUDIENCE CRUD OPERATIONS
  // ==========================================================================

  /**
   * Get all audiences
   */
  static async getAllAudiences() {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audiences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching audiences:', error);
      throw error;
    }
  }

  /**
   * Get a specific audience by ID
   */
  static async getAudience(audienceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences/${audienceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audience');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching audience:', error);
      throw error;
    }
  }

  /**
   * Create a new audience
   */
  static async createAudience(audienceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(audienceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create audience');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating audience:', error);
      throw error;
    }
  }

  /**
   * Update an existing audience
   */
  static async updateAudience(audienceId, audienceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences/${audienceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(audienceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update audience');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating audience:', error);
      throw error;
    }
  }

  /**
   * Delete an audience
   */
  static async deleteAudience(audienceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences/${audienceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete audience');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting audience:', error);
      throw error;
    }
  }

  // ==========================================================================
  // AUDIENCE MEMBERS
  // ==========================================================================

  /**
   * Get all members of an audience
   */
  static async getAudienceMembers(audienceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences/${audienceId}/members`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audience members');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching audience members:', error);
      throw error;
    }
  }

  // ==========================================================================
  // SURVEY RESPONSE FILTERING
  // ==========================================================================

  /**
   * Get users based on survey response filters
   */
  static async getUsersFromSurveyResponses(filters) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences/survey-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to filter survey responses');
      }

      return await response.json();
    } catch (error) {
      console.error('Error filtering survey responses:', error);
      throw error;
    }
  }

  // ==========================================================================
  // SEND REMINDERS
  // ==========================================================================

  /**
   * Send reminder emails to all members of an audience
   */
  static async sendAudienceReminders(audienceId, reminderData = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences/${audienceId}/send-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reminders');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending audience reminders:', error);
      throw error;
    }
  }

  // ==========================================================================
  // AUDIENCE SIZE ESTIMATION
  // ==========================================================================

  /**
   * Estimate the number of users matching the given audience filters.
   * When no filters are provided, returns the total user count.
   */
  static async estimateAudienceSize(filters = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/audiences/estimate-size`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to estimate audience size');
      }

      return await response.json();
    } catch (error) {
      console.error('Error estimating audience size:', error);
      throw error;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get all users (for selection)
   */
  static async getAllUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get all organizations (for selection)
   */
  static async getAllOrganizations() {
    try {
      const response = await fetch(`${API_BASE_URL}/organizations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch organizations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  /**
   * Get all organization types (for selection)
   */
  static async getOrganizationTypes() {
    try {
      const response = await fetch(`${API_BASE_URL}/organization-types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch organization types');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching organization types:', error);
      throw error;
    }
  }

  /**
   * Get all survey templates (for filtering)
   */
  static async getSurveyTemplates() {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch survey templates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching survey templates:', error);
      throw error;
    }
  }
}

export default AudienceService;
