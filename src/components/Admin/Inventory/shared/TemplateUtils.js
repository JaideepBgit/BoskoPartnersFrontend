// src/components/Admin/Inventory/shared/TemplateUtils.js
import InventoryService from '../../../../services/Admin/Inventory/InventoryService';

// Shared utility functions for template handling
const TemplateUtils = {
  // Fetch template versions
  fetchTemplateVersions: async () => {
    try {
      const data = await InventoryService.getTemplateVersions();
      return data;
    } catch (err) {
      console.error('Error fetching template versions:', err.response || err);
      return [];
    }
  },

  // Fetch templates
  fetchTemplates: async () => {
    try {
      const data = await InventoryService.getTemplates();
      return data;
    } catch (err) {
      console.error('Error fetching templates:', err.response || err);
      return [];
    }
  },

  // Fetch a specific template
  fetchTemplate: async (id) => {
    try {
      const data = await InventoryService.getTemplate(id);
      return data;
    } catch (err) {
      console.error('Error fetching template:', err.response || err);
      return null;
    }
  },

  // Add a template
  addTemplate: async (templateData) => {
    try {
      const payload = {
        ...templateData,
        created_by: 1, // TODO: Get from auth context
        questions: templateData.questions || []
      };
      await InventoryService.addTemplate(payload);
      return true;
    } catch (err) {
      console.error('Error adding template:', err.response || err);
      return false;
    }
  },

  // Delete a template
  deleteTemplate: async (templateId) => {
    try {
      await InventoryService.deleteTemplate(templateId);
      return true;
    } catch (err) {
      console.error('Error deleting template:', err.response || err);
      return false;
    }
  },

  // Update template questions
  updateTemplateQuestions: async (templateId, updatedQuestions) => {
    try {
      await InventoryService.updateTemplate(templateId, { questions: updatedQuestions });
      return true;
    } catch (err) {
      console.error('Error updating questions:', err.response || err);
      return false;
    }
  },

  // Delete a question from a template
  deleteTemplateQuestion: async (templateId, questionId) => {
    try {
      await InventoryService.deleteTemplateQuestion(templateId, questionId);
      return true;
    } catch (err) {
      console.error('Error deleting question:', err.response || err);
      return false;
    }
  },

  // Group questions by section
  groupQuestionsBySection: (questions) => {
    const sections = questions?.reduce((acc, question) => {
      // Assuming section is stored in question.config.section or similar
      const sectionId = question.config?.section || 1;
      if (!acc[sectionId]) {
        acc[sectionId] = [];
      }
      acc[sectionId].push(question);
      return acc;
    }, {}) || {};
    
    return sections;
  },

  // Calculate survey statistics
  calculateSurveyStats: (questions) => {
    const sections = TemplateUtils.groupQuestionsBySection(questions);
    const sectionCount = Object.keys(sections).length || 0;
    const questionCount = questions?.length || 0;
    // Estimate 1 minute per question as default
    const estimatedTime = questionCount;
    
    return {
      sectionCount,
      questionCount,
      estimatedTime,
      sections
    };
  },

  // Get question type name
  getQuestionTypeName: (typeId, questionTypes) => {
    const type = questionTypes.find(t => t.id === typeId);
    return type ? type.name : 'Unknown';
  }
};

export default TemplateUtils;