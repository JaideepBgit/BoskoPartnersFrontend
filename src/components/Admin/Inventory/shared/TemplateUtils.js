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
      console.log('TemplateUtils: Deleting template ID:', templateId);
      const response = await InventoryService.deleteTemplate(templateId);
      console.log('TemplateUtils: Delete response:', response);
      return true;
    } catch (err) {
      console.error('TemplateUtils: Error deleting template:', err);
      if (err.response) {
        console.error('TemplateUtils: Response status:', err.response.status);
        console.error('TemplateUtils: Response data:', err.response.data);
      }
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

  // Update template name
  updateTemplateName: async (templateId, newName) => {
    try {
      console.log('TemplateUtils: Updating template name for ID:', templateId, 'to:', newName);
      const response = await InventoryService.updateTemplate(templateId, { survey_code: newName });
      console.log('TemplateUtils: Update name response:', response);
      return true;
    } catch (err) {
      console.error('TemplateUtils: Error updating template name:', err);
      if (err.response) {
        console.error('TemplateUtils: Response status:', err.response.status);
        console.error('TemplateUtils: Response data:', err.response.data);
      }
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
  /*groupQuestionsBySection: (questions) => {
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
  },*/

  groupQuestionsBySection: (questions) => {
    return (questions || []).reduce((acc, q) => {
      // use q.section (string) rather than config.section
      const sec = q.section || 'Uncategorized';
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(q);
      return acc;
    }, {});
  },

  // Group questions by section with ordering
  groupQuestionsBySectionWithOrder: (questions, sectionOrder = {}) => {
    const grouped = TemplateUtils.groupQuestionsBySection(questions);
    
    // Sort sections by their order
    const sortedSections = Object.keys(grouped).sort((a, b) => {
      const orderA = sectionOrder[a] !== undefined ? sectionOrder[a] : 999;
      const orderB = sectionOrder[b] !== undefined ? sectionOrder[b] : 999;
      return orderA - orderB;
    });
    
    const orderedSections = {};
    sortedSections.forEach(sectionName => {
      orderedSections[sectionName] = grouped[sectionName];
    });
    
    return orderedSections;
  },

  // Get existing sections from questions
  getExistingSections: (questions, sectionOrder = {}) => {
    const sections = new Set();
    (questions || []).forEach(q => {
      const section = q.section || 'Uncategorized';
      if (section !== 'Uncategorized') {
        sections.add(section);
      }
    });
    
    // Sort sections by their order if provided, otherwise alphabetically
    return Array.from(sections).sort((a, b) => {
      const orderA = sectionOrder[a] !== undefined ? sectionOrder[a] : 999;
      const orderB = sectionOrder[b] !== undefined ? sectionOrder[b] : 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.localeCompare(b);
    });
  },

  // Fetch template sections
  fetchTemplateSections: async (templateId) => {
    try {
      const data = await InventoryService.getTemplateSections(templateId);
      return data;
    } catch (err) {
      console.error('Error fetching template sections:', err.response || err);
      return [];
    }
  },

  // Update template sections order
  updateTemplateSectionsOrder: async (templateId, sections) => {
    try {
      await InventoryService.updateTemplateSections(templateId, sections);
      return true;
    } catch (err) {
      console.error('Error updating template sections:', err.response || err);
      return false;
    }
  },
  

  // Calculate survey statistics
  calculateSurveyStats: (questions, sectionOrder = {}) => {
    const sections = TemplateUtils.groupQuestionsBySectionWithOrder(questions, sectionOrder);
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