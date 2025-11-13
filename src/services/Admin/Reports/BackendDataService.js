/**
 * Service for loading survey data from backend API
 */

class BackendDataService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Fetch survey responses from backend with survey type filtering
   */
  async loadSurveyResponses(surveyTypeFilter = null) {
    try {
      console.log('🔄 BackendDataService.loadSurveyResponses called with filter:', surveyTypeFilter);
      console.log('🔄 Base URL:', this.baseURL);
      
      // Use the new admin endpoint that automatically determines survey type from organization type
      const responses = await this.fetchAdminResponses(surveyTypeFilter);
      console.log('🔄 Raw responses from fetchAdminResponses:', responses);
      
      // If survey type filter is applied, responses will be an array
      if (surveyTypeFilter) {
        console.log('🔄 Survey type filter applied, creating grouped responses');
        const groupedResponses = {
          church: [],
          institution: [],
          nonFormal: [],
          questions: await this.fetchSurveyQuestions()
        };
        
        groupedResponses[surveyTypeFilter] = responses;
        console.log('🔄 Final grouped responses with filter:', groupedResponses);
        return groupedResponses;
      }
      
      // If no filter, responses will be an object grouped by survey type
      const finalResponses = {
        church: responses.church || [],
        institution: responses.institution || [],
        nonFormal: responses.nonFormal || [],
        questions: await this.fetchSurveyQuestions()
      };
      
      console.log('🔄 Final responses without filter:', {
        church: finalResponses.church.length,
        institution: finalResponses.institution.length,
        nonFormal: finalResponses.nonFormal.length,
        questionsLoaded: !!finalResponses.questions
      });
      
      return finalResponses;
    } catch (error) {
      console.error('❌ Error loading backend data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        baseURL: this.baseURL,
        surveyTypeFilter
      });
      throw error;
    }
  }

  /**
   * Fetch admin survey responses with optional survey type filter
   * Now uses the geo-enabled endpoint for location data
   */
  async fetchAdminResponses(surveyTypeFilter = null) {
    try {
      let url = `${this.baseURL}/survey-responses/admin/geo`;
      if (surveyTypeFilter) {
        url += `?survey_type=${encodeURIComponent(surveyTypeFilter)}`;
      }

      console.log('🌐 Making request to geo-enabled endpoint:', url);
      console.log('🌐 Survey type filter:', surveyTypeFilter);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${token}`
        }
      });

      console.log('🌐 Response status:', response.status);
      console.log('🌐 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🌐 Response error text:', errorText);
        throw new Error(`Failed to fetch survey responses: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🌐 Raw response data:', data);
      console.log('🌐 Data type:', typeof data);
      console.log('🌐 Is array:', Array.isArray(data));
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        console.log('🌐 Object keys:', Object.keys(data));
        console.log('🌐 Data structure:', {
          church: data.church?.length || 0,
          institution: data.institution?.length || 0,
          nonFormal: data.nonFormal?.length || 0,
          other: data.other?.length || 0
        });
      }
      
      // If survey type filter is applied, data is an array
      if (surveyTypeFilter) {
        console.log('🌐 Processing filtered response as array');
        const transformed = this.transformResponseArray(data);
        console.log('🌐 Transformed filtered data:', transformed.length, 'items');
        return transformed;
      }
      
      // If no filter, data is an object with survey types as keys
      console.log('🌐 Processing unfiltered response as object');
      const result = {
        church: this.transformResponseArray(data.church || []),
        institution: this.transformResponseArray(data.institution || []),
        nonFormal: this.transformResponseArray(data.nonFormal || []),
        other: this.transformResponseArray(data.other || [])
      };
      
      console.log('🌐 Final transformed result:', {
        church: result.church.length,
        institution: result.institution.length,
        nonFormal: result.nonFormal.length,
        other: result.other.length
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching admin survey responses:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        url: `${this.baseURL}/survey-responses/admin/geo`,
        surveyTypeFilter
      });
      throw error;
    }
  }

  // Legacy methods kept for backward compatibility but now use the admin endpoint
  
  /**
   * Fetch church survey responses
   */
  async fetchChurchResponses() {
    return this.fetchAdminResponses('church');
  }

  /**
   * Fetch institution survey responses
   */
  async fetchInstitutionResponses() {
    return this.fetchAdminResponses('institution');
  }

  /**
   * Fetch non-formal survey responses
   */
  async fetchNonFormalResponses() {
    return this.fetchAdminResponses('nonFormal');
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

  /**
   * Transform response array from backend format to frontend format
   * Now includes geographic data from the geo-enabled endpoint
   */
  transformResponseArray(backendData) {
    if (!Array.isArray(backendData)) {
      return [];
    }

    return backendData.map(response => {
      const baseResponse = {
        id: response.id || response.response_id,
        survey_type: response.survey_type,
        response_date: response.response_date || response.created_at,
        template_id: response.template_id,
        user_id: response.user_id,
        status: response.status,
        answers: response.answers,
        user_name: response.user_name,
        user_email: response.user_email,
        organization_id: response.organization_id,
        organization_name: response.organization_name,
        organization_type_id: response.organization_type_id,
        organization_type_name: response.organization_type_name,
        city: response.city,
        country: response.country,
        physical_address: response.physical_address,
        town: response.town,
        age_group: response.age_group,
        education_level: response.education_level,
        // Geographic data from geo_locations table
        state: response.state,
        postal_code: response.postal_code,
        latitude: response.latitude,
        longitude: response.longitude,
        timezone: response.timezone
      };

      // Add survey-type specific fields
      if (response.survey_type === 'church') {
        baseResponse.church_name = response.church_name || response.organization_name;
        baseResponse.pastor_name = response.pastor_name || response.user_name;
      } else if (response.survey_type === 'institution') {
        baseResponse.institution_name = response.institution_name || response.organization_name;
        baseResponse.president_name = response.president_name || response.user_name;
      } else if (response.survey_type === 'nonFormal' || response.survey_type === 'non_formal') {
        baseResponse.ministry_name = response.ministry_name || response.organization_name;
        baseResponse.leader_name = response.leader_name || response.user_name;
      }

      return baseResponse;
    });
  }

  /**
   * Get available survey types
   */
  getSurveyTypes() {
    return [
      { value: 'church', label: 'Church Survey' },
      { value: 'institution', label: 'Institution Survey' },
      { value: 'nonFormal', label: 'Non-Formal Survey' }
    ];
  }

  /**
   * Compare surveys based on matching template questions
   * Only compares surveys with the same template (same questions)
   */
  async compareByTemplate(targetResponseId, organizationType) {
    try {
      console.log('🔄 Comparing surveys by template:', { targetResponseId, organizationType });
      
      const response = await fetch(`${this.baseURL}/survey-responses/compare-by-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_response_id: targetResponseId,
          organization_type: organizationType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to compare surveys');
      }

      const data = await response.json();
      console.log('🔄 Template comparison result:', data);
      
      return data;
    } catch (error) {
      console.error('Error comparing surveys by template:', error);
      throw error;
    }
  }
}

export default new BackendDataService();
