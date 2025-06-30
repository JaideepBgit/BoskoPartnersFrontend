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
  
  // Templates
  getTemplates: () => axios.get(`${BASE_URL}/templates`).then(res => res.data),
  getTemplate: (templateId) => axios.get(`${BASE_URL}/templates/${templateId}`).then(res => res.data),
  addTemplate: (payload) => axios.post(`${BASE_URL}/templates`, payload).then(res => res.data),
  updateTemplate: (templateId, payload) => axios.put(`${BASE_URL}/templates/${templateId}`, payload),
  deleteTemplate: (templateId) => axios.delete(`${BASE_URL}/templates/${templateId}`),
  deleteTemplateQuestion: (templateId, questionId) => axios.delete(`${BASE_URL}/templates/${templateId}/questions/${questionId}`),
  
  // Template Sections
  getTemplateSections: (templateId) => axios.get(`${BASE_URL}/templates/${templateId}/sections`).then(res => res.data),
  updateTemplateSections: (templateId, sections) => axios.put(`${BASE_URL}/templates/${templateId}/sections`, { sections }),
  
  // Responses
  getResponses: () => axios.get(`${BASE_URL}/responses`).then(res => res.data),
  getResponse: (responseId) => axios.get(`${BASE_URL}/responses/${responseId}`).then(res => res.data),
  addResponse: (templateId, payload) => axios.post(`${BASE_URL}/templates/${templateId}/responses`, payload),
  updateResponse: (responseId, payload) => axios.put(`${BASE_URL}/responses/${responseId}`, payload),
  
  // Organizations
  getOrganizations: () => axios.get(`${BASE_URL}/organizations`).then(res => res.data),
  
  // Question Types
  getQuestionTypes: (category = null) => {
    const url = category ? `${BASE_URL}/question-types?category=${category}` : `${BASE_URL}/question-types`;
    return axios.get(url).then(res => res.data);
  },
  getQuestionType: (typeId) => axios.get(`${BASE_URL}/question-types/${typeId}`).then(res => res.data),
  getQuestionTypeCategories: () => axios.get(`${BASE_URL}/question-types/categories`).then(res => res.data),
  initializeQuestionTypes: () => axios.post(`${BASE_URL}/question-types/initialize`),
  
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
