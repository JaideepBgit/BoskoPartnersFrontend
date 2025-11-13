/**
 * Question Service
 * 
 * Handles fetching survey questions with their types and metadata
 * for the Custom Chart Builder
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class QuestionService {
  /**
   * Fetch questions with their types for a specific survey type
   * @param {string} surveyType - Survey type (church, institution, nonFormal)
   * @returns {Promise<Array>} Array of templates with questions
   */
  static async fetchQuestionsWithTypes(surveyType = null) {
    try {
      console.log(`📊 QuestionService - Fetching questions with types for survey type: ${surveyType}`);
      console.log(`📊 QuestionService - API_BASE_URL: ${API_BASE_URL}`);
      
      const params = {};
      if (surveyType) {
        params.survey_type = surveyType;
      }
      console.log(`📊 QuestionService - Request params:`, params);
      
      const fullUrl = `${API_BASE_URL}/survey-questions/with-types`;
      console.log(`📊 QuestionService - Full URL: ${fullUrl}`);
      
      const response = await axios.get(fullUrl, { params });
      
      console.log(`✅ QuestionService - Response status: ${response.status}`);
      console.log(`✅ QuestionService - Fetched ${response.data?.length || 0} templates with questions`);
      console.log(`📊 QuestionService - Response data structure:`, response.data);
      
      if (response.data && response.data.length > 0) {
        console.log(`📊 QuestionService - First template:`, response.data[0]);
        console.log(`📊 QuestionService - First template questions count:`, response.data[0].questions?.length || 0);
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ QuestionService - Error fetching questions with types:', error);
      console.error('❌ QuestionService - Error response:', error.response?.data);
      console.error('❌ QuestionService - Error status:', error.response?.status);
      throw error;
    }
  }

  /**
   * Fetch questions for a specific template
   * @param {number} templateId - Template ID
   * @returns {Promise<Object>} Template with questions
   */
  static async fetchQuestionsByTemplate(templateId) {
    try {
      console.log(`📊 Fetching questions for template: ${templateId}`);
      
      const response = await axios.get(`${API_BASE_URL}/survey-questions/with-types`, {
        params: { template_id: templateId }
      });
      
      if (response.data.length > 0) {
        console.log(`✅ Fetched ${response.data[0].questions.length} questions`);
        return response.data[0];
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error fetching questions by template:', error);
      throw error;
    }
  }

  /**
   * Group questions by section
   * @param {Array} questions - Array of question objects
   * @returns {Object} Questions grouped by section
   */
  static groupQuestionsBySection(questions) {
    const grouped = {};
    
    questions.forEach(question => {
      const section = question.section || 'General';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(question);
    });
    
    return grouped;
  }

  /**
   * Filter questions by type
   * @param {Array} questions - Array of question objects
   * @param {Array} questionTypeIds - Array of question type IDs to include
   * @returns {Array} Filtered questions
   */
  static filterQuestionsByType(questions, questionTypeIds) {
    if (!questionTypeIds || questionTypeIds.length === 0) {
      return questions;
    }
    
    return questions.filter(q => questionTypeIds.includes(q.question_type_id));
  }

  /**
   * Get numeric questions only
   * @param {Array} questions - Array of question objects
   * @returns {Array} Numeric questions
   */
  static getNumericQuestions(questions) {
    return questions.filter(q => q.is_numeric);
  }

  /**
   * Get non-numeric questions only
   * @param {Array} questions - Array of question objects
   * @returns {Array} Non-numeric questions
   */
  static getNonNumericQuestions(questions) {
    return questions.filter(q => !q.is_numeric);
  }

  /**
   * Get questions by recommended chart type
   * @param {Array} questions - Array of question objects
   * @param {string} chartType - Chart type identifier
   * @returns {Array} Questions suitable for the chart type
   */
  static getQuestionsByChartType(questions, chartType) {
    return questions.filter(q => q.recommended_chart === chartType);
  }

  /**
   * Search questions by text
   * @param {Array} questions - Array of question objects
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching questions
   */
  static searchQuestions(questions, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return questions;
    }
    
    const term = searchTerm.toLowerCase();
    return questions.filter(q => 
      q.text.toLowerCase().includes(term) ||
      (q.section && q.section.toLowerCase().includes(term)) ||
      (q.question_type_display && q.question_type_display.toLowerCase().includes(term))
    );
  }

  /**
   * Get question statistics
   * @param {Array} questions - Array of question objects
   * @returns {Object} Statistics about questions
   */
  static getQuestionStatistics(questions) {
    const stats = {
      total: questions.length,
      numeric: 0,
      nonNumeric: 0,
      required: 0,
      optional: 0,
      byType: {},
      bySection: {},
      byChartType: {}
    };
    
    questions.forEach(q => {
      // Count numeric vs non-numeric
      if (q.is_numeric) {
        stats.numeric++;
      } else {
        stats.nonNumeric++;
      }
      
      // Count required vs optional
      if (q.is_required) {
        stats.required++;
      } else {
        stats.optional++;
      }
      
      // Count by question type
      const typeName = q.question_type_display || q.question_type_name;
      stats.byType[typeName] = (stats.byType[typeName] || 0) + 1;
      
      // Count by section
      const section = q.section || 'General';
      stats.bySection[section] = (stats.bySection[section] || 0) + 1;
      
      // Count by recommended chart type
      const chartType = q.recommended_chart;
      stats.byChartType[chartType] = (stats.byChartType[chartType] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Format question for display
   * @param {Object} question - Question object
   * @param {number} maxLength - Maximum text length
   * @returns {Object} Formatted question
   */
  static formatQuestionForDisplay(question, maxLength = 100) {
    let displayText = question.text;
    if (displayText.length > maxLength) {
      displayText = displayText.substring(0, maxLength) + '...';
    }
    
    return {
      ...question,
      displayText,
      fullText: question.text,
      typeLabel: question.question_type_display || question.question_type_name,
      sectionLabel: question.section || 'General',
      requiredLabel: question.is_required ? 'Required' : 'Optional',
      numericLabel: question.is_numeric ? 'Numeric' : 'Non-Numeric'
    };
  }

  /**
   * Get all unique sections from questions
   * @param {Array} questions - Array of question objects
   * @returns {Array} Array of unique section names
   */
  static getUniqueSections(questions) {
    const sections = new Set();
    questions.forEach(q => {
      sections.add(q.section || 'General');
    });
    return Array.from(sections).sort();
  }

  /**
   * Get all unique question types from questions
   * @param {Array} questions - Array of question objects
   * @returns {Array} Array of unique question type objects
   */
  static getUniqueQuestionTypes(questions) {
    const typesMap = new Map();
    
    questions.forEach(q => {
      if (!typesMap.has(q.question_type_id)) {
        typesMap.set(q.question_type_id, {
          id: q.question_type_id,
          name: q.question_type_name,
          display: q.question_type_display,
          category: q.question_type_category,
          isNumeric: q.is_numeric
        });
      }
    });
    
    return Array.from(typesMap.values()).sort((a, b) => a.id - b.id);
  }
}

export default QuestionService;
