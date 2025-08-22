/**
 * Service for loading and processing sample survey data for analytics
 */

class SampleDataService {
  constructor() {
    this.cachedData = {};
  }

  /**
   * Load sample data from JSON files
   */
  async loadSampleData() {
    try {
      const [
        churchResponses,
        institutionResponses,
        nonFormalResponses,
        surveyQuestions
      ] = await Promise.all([
        fetch('/sample-data/church-survey-responses.json').then(r => r.json()),
        fetch('/sample-data/institution-survey-responses.json').then(r => r.json()),
        fetch('/sample-data/non-formal-survey-responses.json').then(r => r.json()),
        fetch('/sample-data/survey-questions.json').then(r => r.json())
      ]);

      this.cachedData = {
        church: churchResponses.responses,
        institution: institutionResponses.responses,
        nonFormal: nonFormalResponses.responses,
        questions: surveyQuestions
      };

      return this.cachedData;
    } catch (error) {
      console.error('Error loading sample data:', error);
      throw error;
    }
  }

  /**
   * Get all responses for a specific survey type
   */
  getResponsesBySurveyType(surveyType) {
    if (!this.cachedData[surveyType]) {
      throw new Error(`No data available for survey type: ${surveyType}`);
    }
    return this.cachedData[surveyType];
  }

  /**
   * Compare one survey response with all others of the same type
   */
  compareWithSimilar(targetResponse, surveyType, customResponses = null) {
    const allResponses = customResponses || this.getResponsesBySurveyType(surveyType);
    const others = allResponses.filter(r => r.id !== targetResponse.id);
    
    return {
      target: targetResponse,
      others: others,
      averages: this.calculateAverages(others, surveyType),
      targetScores: this.extractScores(targetResponse, surveyType)
    };
  }

  /**
   * Calculate average scores across multiple responses
   */
  calculateAverages(responses, surveyType) {
    if (responses.length === 0) return {};

    const scoreField = this.getScoreField(surveyType);
    if (!scoreField) return {};

    const averages = {};
    const firstResponse = responses[0];
    
    if (firstResponse[scoreField]) {
      Object.keys(firstResponse[scoreField]).forEach(key => {
        const scores = responses
          .map(r => r[scoreField] && r[scoreField][key])
          .filter(score => score !== undefined && score !== null);
        
        if (scores.length > 0) {
          averages[key] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
      });
    }

    return averages;
  }

  /**
   * Extract scores from a single response
   */
  extractScores(response, surveyType) {
    const scoreField = this.getScoreField(surveyType);
    return response[scoreField] || {};
  }

  /**
   * Get the field name that contains scores for each survey type
   */
  getScoreField(surveyType) {
    const scoreFields = {
      church: 'ministry_training_scores',
      institution: 'leadership_assessment',
      nonFormal: 'ministry_training_scores'
    };
    return scoreFields[surveyType];
  }

  /**
   * Get geographic distribution of responses
   */
  getGeographicDistribution(surveyType) {
    const responses = this.getResponsesBySurveyType(surveyType);
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
   * Filter responses by criteria
   */
  filterResponses(surveyType, filters = {}) {
    const responses = this.getResponsesBySurveyType(surveyType);
    
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
   * Get unique values for a field across all responses
   */
  getUniqueValues(surveyType, fieldName) {
    const responses = this.getResponsesBySurveyType(surveyType);
    const values = new Set();
    
    responses.forEach(response => {
      if (response[fieldName]) {
        values.add(response[fieldName]);
      }
    });
    
    return Array.from(values).sort();
  }

  /**
   * Calculate statistics for comparison
   */
  calculateComparisonStats(targetScores, averageScores) {
    const stats = {
      betterThanAverage: 0,
      worseThanAverage: 0,
      equalToAverage: 0,
      totalCategories: 0,
      strengthAreas: [],
      improvementAreas: []
    };

    Object.keys(targetScores).forEach(category => {
      const targetScore = targetScores[category];
      const avgScore = averageScores[category];
      
      if (avgScore !== undefined) {
        stats.totalCategories++;
        
        if (targetScore > avgScore) {
          stats.betterThanAverage++;
          stats.strengthAreas.push({
            category,
            targetScore,
            avgScore,
            difference: targetScore - avgScore
          });
        } else if (targetScore < avgScore) {
          stats.worseThanAverage++;
          stats.improvementAreas.push({
            category,
            targetScore,
            avgScore,
            difference: avgScore - targetScore
          });
        } else {
          stats.equalToAverage++;
        }
      }
    });

    // Sort by difference (highest impact first)
    stats.strengthAreas.sort((a, b) => b.difference - a.difference);
    stats.improvementAreas.sort((a, b) => b.difference - a.difference);

    return stats;
  }

  /**
   * Get display name for a response based on survey type
   */
  getResponseDisplayName(response) {
    if (response.survey_type === 'church') {
      return response.pastor_name || response.church_name;
    } else if (response.survey_type === 'institution') {
      return response.president_name || response.institution_name;
    } else if (response.survey_type === 'non_formal') {
      return response.leader_name || response.ministry_name;
    }
    return `Response ${response.id}`;
  }

  /**
   * Get formatted labels for score categories
   */
  getScoreLabels(category) {
    const labelMap = {
      'preaching': 'Preaching',
      'teaching': 'Teaching',
      'evangelism': 'Evangelism',
      'community_impact': 'Community Impact',
      'discipleship': 'Discipleship',
      'pastoral_care': 'Pastoral Care',
      'church_administration': 'Church Administration',
      'counseling': 'Counseling',
      'organization_leadership': 'Organizational Leadership',
      'conflict_resolution': 'Conflict Resolution',
      'prayer_spiritual_formation': 'Prayer & Spiritual Formation',
      'spiritual_warfare': 'Spiritual Warfare',
      'interpersonal_relations': 'Interpersonal Relations',
      'written_communication': 'Written Communication',
      'teamwork': 'Teamwork',
      'leadership_development': 'Leadership Development',
      'children_youth': 'Children & Youth Ministry',
      'self_care': 'Self Care',
      'marriage_family': 'Marriage & Family',
      'emotional_mental_health': 'Emotional & Mental Health',
      'organizational_leadership_training': 'Organizational Leadership Training',
      'strategic_planning': 'Strategic Planning',
      'financial_management': 'Financial Management',
      'curriculum_development': 'Curriculum Development',
      'faculty_development': 'Faculty Development',
      'student_affairs': 'Student Affairs',
      'community_relations': 'Community Relations',
      'fundraising': 'Fundraising',
      'governance': 'Governance',
      'accreditation_compliance': 'Accreditation & Compliance'
    };
    
    return labelMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Filter responses from a custom base set
   */
  filterResponsesWithBase(baseResponses, filters = {}) {
    return baseResponses.filter(response => {
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
   * Get geographic distribution from a custom base set of responses
   */
  getGeographicDistributionWithBase(baseResponses) {
    const distribution = {};

    baseResponses.forEach(response => {
      const country = response.country;
      if (!distribution[country]) {
        distribution[country] = {
          count: 0,
          cities: new Set()
        };
      }
      distribution[country].count++;
      if (response.city) {
        distribution[country].cities.add(response.city);
      }
    });

    // Convert sets to arrays for consistent structure
    Object.keys(distribution).forEach(country => {
      distribution[country].cities = Array.from(distribution[country].cities);
    });

    return distribution;
  }

  /**
   * Get unique values from a custom base set of responses
   */
  getUniqueValuesWithBase(baseResponses, fieldName) {
    const values = new Set();
    
    baseResponses.forEach(response => {
      if (response[fieldName]) {
        values.add(response[fieldName]);
      }
    });
    
    return Array.from(values).sort();
  }
}

export default new SampleDataService();
