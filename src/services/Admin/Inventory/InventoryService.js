// src/services/Admin/Inventory/InventoryService.js
import axios from 'axios';

const InventoryService = {
  // Template Versions
  getTemplateVersions: () => axios.get('/api/template-versions').then(res => res.data),
  addTemplateVersion: (name, description) => axios.post('/api/template-versions', { name, description }),
  deleteTemplateVersion: (versionId) => axios.delete(`/api/template-versions/${versionId}`),
  
  // Templates
  getTemplates: () => axios.get('/api/templates').then(res => res.data),
  getTemplate: (templateId) => axios.get(`/api/templates/${templateId}`).then(res => res.data),
  addTemplate: (payload) => axios.post('/api/templates', payload),
  updateTemplate: (templateId, payload) => axios.put(`/api/templates/${templateId}`, payload),
  deleteTemplate: (templateId) => axios.delete(`/api/templates/${templateId}`),
  deleteTemplateQuestion: (templateId, questionId) => axios.delete(`/api/templates/${templateId}/questions/${questionId}`),
  
  // Responses
  getResponses: () => axios.get('/api/responses').then(res => res.data),
  getResponse: (responseId) => axios.get(`/api/responses/${responseId}`).then(res => res.data),
  addResponse: (templateId, payload) => axios.post(`/api/templates/${templateId}/responses`, payload),
  updateResponse: (responseId, payload) => axios.put(`/api/responses/${responseId}`, payload),
  
  // Legacy methods for backward compatibility
  getVersions: (surveyId) => axios.get(`/api/surveys/${surveyId}/versions`).then(res => res.data),
  getQuestions: (versionId) => axios.get(`/api/versions/${versionId}/questions`).then(res => res.data),
  addVersion: (surveyId, version_number) => axios.post(`/api/surveys/${surveyId}/versions`, { version_number }),
  deleteVersion: (versionId) => axios.delete(`/api/versions/${versionId}`),
  addQuestion: (versionId, payload) => axios.post(`/api/versions/${versionId}/questions`, payload),
  updateQuestion: (questionId, payload) => axios.put(`/api/questions/${questionId}`, payload),
  deleteQuestion: (questionId) => axios.delete(`/api/questions/${questionId}`),
};

export default InventoryService;
