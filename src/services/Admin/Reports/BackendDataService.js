/**
 * Service for loading survey data from backend API
 */

class BackendDataService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Fetch survey responses from backend
   */
  async loadSurveyResponses() {
    try {
      const [
        churchResponses,
        institutionResponses,
        nonFormalResponses,
        surveyQuestions
      ] = await Promise.all([
        this.fetchChurchResponses(),
        this.fetchInstitutionResponses(),
        this.fetchNonFormalResponses(),
        this.fetchSurveyQuestions()
      ]);

      return {
        church: churchResponses,
        institution: institutionResponses,
        nonFormal: nonFormalResponses,
        questions: surveyQuestions
      };
    } catch (error) {
      console.error('Error loading backend data:', error);
      throw error;
    }
  }

  /**
   * Fetch church survey responses
   */
  async fetchChurchResponses() {
    try {
      const response = await fetch(`${this.baseURL}/survey-responses/church`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch church responses: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformChurchResponses(data);
    } catch (error) {
      console.error('Error fetching church responses:', error);
      throw error;
    }
  }

  /**
   * Fetch institution survey responses
   */
  async fetchInstitutionResponses() {
    try {
      const response = await fetch(`${this.baseURL}/survey-responses/institution`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch institution responses: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformInstitutionResponses(data);
    } catch (error) {
      console.error('Error fetching institution responses:', error);
      throw error;
    }
  }

  /**
   * Fetch non-formal survey responses
   */
  async fetchNonFormalResponses() {
    try {
      const response = await fetch(`${this.baseURL}/survey-responses/non-formal`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch non-formal responses: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformNonFormalResponses(data);
    } catch (error) {
      console.error('Error fetching non-formal responses:', error);
      throw error;
    }
  }

  /**
   * Fetch survey questions structure
   */
  async fetchSurveyQuestions() {
    try {
      const response = await fetch(`${this.baseURL}/survey-questions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch survey questions: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      throw error;
    }
  }

  /**
   * Transform church responses from backend format to frontend format
   */
  transformChurchResponses(backendData) {
    if (!Array.isArray(backendData)) {
      return [];
    }

    return backendData.map(response => ({
      id: response.id || response.response_id,
      survey_type: 'church',
      response_date: response.response_date || response.created_at,
      church_name: response.church_name,
      pastor_name: response.pastor_name,
      physical_address: response.physical_address,
      town: response.town,
      city: response.city,
      country: response.country,
      is_senior_pastor: response.is_senior_pastor,
      age_group: response.age_group,
      years_as_pastor: response.years_as_pastor,
      education_level: response.education_level,
      last_training_year: response.last_training_year,
      training_institution: response.training_institution,
      actea_accredited: response.actea_accredited,
      other_accreditation: response.other_accreditation,
      ministry_training_scores: this.parseJsonField(response.ministry_training_scores) || {},
      other_training_areas: response.other_training_areas,
      why_choose_institution: response.why_choose_institution,
      expectations_met: response.expectations_met,
      better_preparation_areas: response.better_preparation_areas,
      institution_changes: response.institution_changes,
      ongoing_support_individual: response.ongoing_support_individual,
      ongoing_support_looks_like: response.ongoing_support_looks_like,
      better_ongoing_support: response.better_ongoing_support
    }));
  }

  /**
   * Transform institution responses from backend format to frontend format
   */
  transformInstitutionResponses(backendData) {
    if (!Array.isArray(backendData)) {
      return [];
    }

    return backendData.map(response => ({
      id: response.id || response.response_id,
      survey_type: 'institution',
      response_date: response.response_date || response.created_at,
      institution_name: response.institution_name,
      affiliated_church: response.affiliated_church,
      president_name: response.president_name,
      physical_address: response.physical_address,
      town: response.town,
      city: response.city,
      country: response.country,
      actea_accredited: response.actea_accredited,
      other_accreditation: response.other_accreditation,
      establishment_year: response.establishment_year,
      preferred_title: response.preferred_title,
      email: response.email,
      website: response.website,
      mission: response.mission,
      is_president: response.is_president,
      age: response.age,
      years_as_president: response.years_as_president,
      terms_to_serve: response.terms_to_serve,
      academic_qualification: response.academic_qualification,
      last_training_year: response.last_training_year,
      highest_training_institution: response.highest_training_institution,
      start_leading_year: response.start_leading_year,
      leadership_assessment: this.parseJsonField(response.leadership_assessment) || {}
    }));
  }

  /**
   * Transform non-formal responses from backend format to frontend format
   */
  transformNonFormalResponses(backendData) {
    if (!Array.isArray(backendData)) {
      return [];
    }

    return backendData.map(response => ({
      id: response.id || response.response_id,
      survey_type: 'non_formal',
      response_date: response.response_date || response.created_at,
      ministry_name: response.ministry_name,
      leader_name: response.leader_name,
      physical_address: response.physical_address,
      town: response.town,
      city: response.city,
      country: response.country,
      is_primary_leader: response.is_primary_leader,
      age_group: response.age_group,
      years_in_ministry: response.years_in_ministry,
      non_formal_education_types: this.parseJsonField(response.non_formal_education_types) || [],
      primary_education_source: response.primary_education_source,
      training_providers: this.parseJsonField(response.training_providers) || [],
      topics_covered: this.parseJsonField(response.topics_covered) || [],
      ministry_training_scores: this.parseJsonField(response.ministry_training_scores) || {}
    }));
  }

  /**
   * Helper function to parse JSON fields from backend
   */
  parseJsonField(field) {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (error) {
        console.warn('Failed to parse JSON field:', field);
        return null;
      }
    }
    return field;
  }

  /**
   * Get unique values for a field across all responses of a type
   */
  getUniqueValues(responses, fieldName) {
    if (!Array.isArray(responses)) {
      return [];
    }

    const values = new Set();
    responses.forEach(response => {
      if (response[fieldName]) {
        values.add(response[fieldName]);
      }
    });
    
    return Array.from(values).sort();
  }

  /**
   * Filter responses by criteria
   */
  filterResponses(responses, filters = {}) {
    if (!Array.isArray(responses)) {
      return [];
    }
    
    return responses.filter(response => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true; // Skip empty filters
        
        const responseValue = response[key];
        if (Array.isArray(value)) {
          return value.includes(responseValue);
        }
        return responseValue === value;
      });
    });
  }

  /**
   * Get geographic distribution of responses
   */
  getGeographicDistribution(responses) {
    if (!Array.isArray(responses)) {
      return {};
    }

    const distribution = {};
    responses.forEach(response => {
      const country = response.country;
      if (!distribution[country]) {
        distribution[country] = {
          count: 0,
          cities: new Set(),
          responses: []
        };
      }
      distribution[country].count++;
      distribution[country].cities.add(response.city);
      distribution[country].responses.push(response);
    });

    // Convert Sets to Arrays for JSON serialization
    Object.keys(distribution).forEach(country => {
      distribution[country].cities = Array.from(distribution[country].cities);
    });

    return distribution;
  }
}

export default new BackendDataService();
