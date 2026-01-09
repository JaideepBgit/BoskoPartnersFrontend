// src/services/Admin/Inventory/InventoryService.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const InventoryService = {
  // Template Versions
  getTemplateVersions: (organizationId = null) => {
    const url = organizationId ? `${BASE_URL}/template-versions?organization_id=${organizationId}` : `${BASE_URL}/template-versions`;
    return axios.get(url).then(res => res.data);
  },
  addTemplateVersion: (name, description, organizationId) => axios.post(`${BASE_URL}/template-versions`, { name, description, organization_id: organizationId }),
  updateTemplateVersion: (versionId, name, description, organizationId = null) => {
    const data = { name, description };
    if (organizationId) data.organization_id = organizationId;
    return axios.put(`${BASE_URL}/template-versions/${versionId}`, data);
  },
  deleteTemplateVersion: (versionId) => axios.delete(`${BASE_URL}/template-versions/${versionId}`),
  copyTemplateVersion: (versionId, targetOrganizationId, newVersionName = '') =>
    axios.post(`${BASE_URL}/template-versions/${versionId}/copy`, {
      target_organization_id: targetOrganizationId,
      new_version_name: newVersionName
    }).then(res => res.data),

  // Templates
  getTemplates: () => axios.get(`${BASE_URL}/templates`).then(res => res.data),
  getTemplate: (templateId) => axios.get(`${BASE_URL}/templates/${templateId}`).then(res => res.data),
  addTemplate: (payload) => axios.post(`${BASE_URL}/templates`, payload).then(res => res.data),
  updateTemplate: (templateId, payload) => axios.put(`${BASE_URL}/templates/${templateId}`, payload),
  deleteTemplate: (templateId) => axios.delete(`${BASE_URL}/templates/${templateId}`),
  deleteTemplateQuestion: (templateId, questionId) => axios.delete(`${BASE_URL}/templates/${templateId}/questions/${questionId}`),
  copyTemplate: (templateId, targetOrganizationId, targetVersionName = 'Copied Templates', newSurveyCode = '') =>
    axios.post(`${BASE_URL}/templates/${templateId}/copy`, {
      target_organization_id: targetOrganizationId,
      target_version_name: targetVersionName,
      new_survey_code: newSurveyCode
    }).then(res => res.data),

  // Template Sections
  getTemplateSections: (templateId) => axios.get(`${BASE_URL}/templates/${templateId}/sections`).then(res => res.data),
  updateTemplateSections: (templateId, sections) => axios.put(`${BASE_URL}/templates/${templateId}/sections`, { sections }),

  // Responses
  getResponses: () => axios.get(`${BASE_URL}/responses`).then(res => res.data),
  getResponse: (responseId) => axios.get(`${BASE_URL}/responses/${responseId}`).then(res => res.data),
  addResponse: (templateId, payload) => axios.post(`${BASE_URL}/templates/${templateId}/responses`, payload),
  updateResponse: (responseId, payload) => axios.put(`${BASE_URL}/responses/${responseId}`, payload),

  // Email Templates
  getEmailTemplates: (organizationId = null, filterOrganizationId = null) => {
    let url = `${BASE_URL}/email-templates`;
    const params = new URLSearchParams();

    if (organizationId) params.append('organization_id', organizationId);
    if (filterOrganizationId) params.append('filter_organization_id', filterOrganizationId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return axios.get(url)
      .then(res => res.data.templates || res.data)
      .catch(error => {
        console.error('Error fetching email templates:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch email templates');
      });
  },

  // Get all email templates using dedicated endpoint with enhanced debugging
  getAllEmailTemplates: () => {
    console.log('[InventoryService] Calling dedicated /api/email-templates/all endpoint');
    return axios.get(`${BASE_URL}/email-templates/all`)
      .then(res => {
        console.log(`[InventoryService] Successfully fetched ${res.data.count || 0} templates from dedicated endpoint`);
        if (res.data.conversion_errors && res.data.conversion_errors.length > 0) {
          console.warn('[InventoryService] Some templates had conversion errors:', res.data.conversion_errors);
        }
        return res.data.templates || [];
      })
      .catch(error => {
        console.error('[InventoryService] Error fetching all email templates:', error);
        console.error('[InventoryService] Error details:', error.response?.data);
        throw new Error(error.response?.data?.error || 'Failed to fetch all email templates');
      });
  },
  getEmailTemplate: (templateId) => {
    return axios.get(`${BASE_URL}/email-templates/${templateId}`)
      .then(res => res.data)
      .catch(error => {
        console.error('Error fetching email template:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch email template');
      });
  },
  addEmailTemplate: (payload) => {
    // Clean payload - only basic email template fields
    const cleanPayload = {
      name: payload.name,
      subject: payload.subject,
      html_body: payload.html_body,
      text_body: payload.text_body || '',
      organization_id: payload.organization_id,
      is_public: payload.is_public || false
    };

    return axios.post(`${BASE_URL}/email-templates`, cleanPayload)
      .then(res => res.data)
      .catch(error => {
        console.error('Error creating email template:', error);
        const errorMessage = error.response?.data?.error || 'Failed to create email template';
        throw new Error(errorMessage);
      });
  },
  updateEmailTemplate: (templateId, payload) => {
    // Clean payload - only basic email template fields
    const cleanPayload = {
      name: payload.name,
      subject: payload.subject,
      html_body: payload.html_body,
      text_body: payload.text_body || '',
      organization_id: payload.organization_id,
      is_public: payload.is_public || false
    };

    return axios.put(`${BASE_URL}/email-templates/${templateId}`, cleanPayload)
      .then(res => res.data)
      .catch(error => {
        console.error('Error updating email template:', error);
        const errorMessage = error.response?.data?.error || 'Failed to update email template';
        throw new Error(errorMessage);
      });
  },
  deleteEmailTemplate: (templateId) => {
    return axios.delete(`${BASE_URL}/email-templates/${templateId}`)
      .catch(error => {
        console.error('Error deleting email template:', error);
        throw new Error(error.response?.data?.error || 'Failed to delete email template');
      });
  },

  // Survey Templates
  getSurveyTemplatesByOrganization: (organizationId) => {
    if (!organizationId) {
      return Promise.reject(new Error('Organization ID is required'));
    }

    return axios.get(`${BASE_URL}/survey-templates/by-organization/${organizationId}`)
      .then(res => {
        const data = res.data;
        // Backend returns an object { organization_id, ..., survey_templates: [...] }
        // Normalize to an array of survey templates for the UI
        if (Array.isArray(data)) {
          return data;
        }
        if (data && Array.isArray(data.survey_templates)) {
          return data.survey_templates;
        }
        // Fallback to empty array
        return [];
      })
      .catch(error => {
        console.error('Error fetching survey templates by organization:', error);
        if (error.response?.status === 404) {
          throw new Error('Organization not found or has no survey templates');
        }
        throw new Error(error.response?.data?.error || 'Failed to fetch survey templates');
      });
  },

  // Organizations
  getOrganizations: () => axios.get(`${BASE_URL}/organizations`).then(res => res.data),

  // Roles
  getRoles: () => axios.get(`${BASE_URL}/roles`).then(res => res.data),

  // Question Types
  getQuestionTypes: (category = null) => {
    const url = category ? `${BASE_URL}/question-types?category=${category}` : `${BASE_URL}/question-types`;
    return axios.get(url).then(res => res.data);
  },
  getQuestionType: (typeId) => axios.get(`${BASE_URL}/question-types/${typeId}`).then(res => res.data),
  getQuestionTypeCategories: () => axios.get(`${BASE_URL}/question-types/categories`).then(res => res.data),
  initializeQuestionTypes: () => axios.post(`${BASE_URL}/question-types/initialize`),

  // Document Parsing
  parseDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${BASE_URL}/document/parse`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(res => res.data);
  },

  // Legacy methods for backward compatibility
  getVersions: (surveyId) => axios.get(`${BASE_URL}/surveys/${surveyId}/versions`).then(res => res.data),
  getQuestions: (versionId) => axios.get(`${BASE_URL}/versions/${versionId}/questions`).then(res => res.data),
  addVersion: (surveyId, version_number) => axios.post(`${BASE_URL}/surveys/${surveyId}/versions`, { version_number }),
  deleteVersion: (versionId) => axios.delete(`${BASE_URL}/versions/${versionId}`),
  addQuestion: (versionId, payload) => axios.post(`${BASE_URL}/versions/${versionId}/questions`, payload),
  updateQuestion: (questionId, payload) => axios.put(`${BASE_URL}/questions/${questionId}`, payload),
  deleteQuestion: (questionId) => axios.delete(`${BASE_URL}/questions/${questionId}`),
};

export default InventoryService;
