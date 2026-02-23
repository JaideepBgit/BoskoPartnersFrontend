// src/services/Admin/SurveysV2Service.js
// Service for the new Surveys V2 API (/api/v2/surveys)
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SurveysV2Service = {
  // ── Surveys CRUD ──────────────────────────────────────────────────────

  getSurveys: () =>
    axios.get(`${BASE_URL}/v2/surveys`).then(res => res.data),

  getSurvey: (surveyId) =>
    axios.get(`${BASE_URL}/v2/surveys/${surveyId}`).then(res => res.data),

  createSurvey: (payload) =>
    axios.post(`${BASE_URL}/v2/surveys`, payload).then(res => res.data),

  updateSurvey: (surveyId, payload) =>
    axios.put(`${BASE_URL}/v2/surveys/${surveyId}`, payload).then(res => res.data),

  deleteSurvey: (surveyId) =>
    axios.delete(`${BASE_URL}/v2/surveys/${surveyId}`).then(res => res.data),

  duplicateSurvey: (surveyId, payload = {}) =>
    axios.post(`${BASE_URL}/v2/surveys/${surveyId}/duplicate`, payload).then(res => res.data),

  // ── Organization attachment ───────────────────────────────────────────

  getSurveyOrganizations: (surveyId) =>
    axios.get(`${BASE_URL}/v2/surveys/${surveyId}/organizations`).then(res => res.data),

  attachOrganizations: (surveyId, organizationIds) =>
    axios.post(`${BASE_URL}/v2/surveys/${surveyId}/organizations`, {
      organization_ids: organizationIds,
    }).then(res => res.data),

  detachOrganization: (surveyId, orgId) =>
    axios.delete(`${BASE_URL}/v2/surveys/${surveyId}/organizations/${orgId}`).then(res => res.data),

  // ── Questions ─────────────────────────────────────────────────────────

  getQuestions: (surveyId) =>
    axios.get(`${BASE_URL}/v2/surveys/${surveyId}/questions`).then(res => res.data),

  addQuestion: (surveyId, payload) =>
    axios.post(`${BASE_URL}/v2/surveys/${surveyId}/questions`, payload).then(res => res.data),

  updateQuestion: (surveyId, questionId, payload) =>
    axios.put(`${BASE_URL}/v2/surveys/${surveyId}/questions/${questionId}`, payload).then(res => res.data),

  deleteQuestion: (surveyId, questionId) =>
    axios.delete(`${BASE_URL}/v2/surveys/${surveyId}/questions/${questionId}`).then(res => res.data),

  // ── Sections ──────────────────────────────────────────────────────────

  getSections: (surveyId) =>
    axios.get(`${BASE_URL}/v2/surveys/${surveyId}/sections`).then(res => res.data),

  updateSections: (surveyId, sections) =>
    axios.put(`${BASE_URL}/v2/surveys/${surveyId}/sections`, { sections }).then(res => res.data),

  // ── Responses ────────────────────────────────────────────────────────

  getResponses: (surveyId) =>
    axios.get(`${BASE_URL}/v2/responses`, { params: { survey_id: surveyId } }).then(res => res.data),

  getResponse: (responseId) =>
    axios.get(`${BASE_URL}/v2/responses/${responseId}`).then(res => res.data),

  createResponse: (surveyId, payload) =>
    axios.post(`${BASE_URL}/v2/surveys/${surveyId}/responses`, payload).then(res => res.data),

  updateResponse: (responseId, payload) =>
    axios.put(`${BASE_URL}/v2/responses/${responseId}`, payload).then(res => res.data),

  inviteUsers: (surveyId, userIds, adminId) =>
    axios.post(`${BASE_URL}/v2/surveys/${surveyId}/invite`, {
      user_ids: userIds,
      admin_id: adminId,
    }).then(res => res.data),

  // ── Shared helpers (delegated to InventoryService for now) ────────────
  // These read from shared tables (organizations, titles, question_types)
  // that are NOT duplicated — we reuse the existing endpoints.

  getOrganizations: () =>
    axios.get(`${BASE_URL}/organizations`).then(res => res.data),

  getTitles: () =>
    axios.get(`${BASE_URL}/titles`).then(res => res.data),

  getQuestionTypes: (category = null) => {
    const url = category
      ? `${BASE_URL}/question-types?category=${category}`
      : `${BASE_URL}/question-types`;
    return axios.get(url).then(res => res.data);
  },
};

export default SurveysV2Service;
