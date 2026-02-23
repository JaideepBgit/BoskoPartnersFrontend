// src/services/Admin/KpiDashboardService.js
// Service for the KPI Dashboard API (/api/kpi/dashboard)
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const KpiDashboardService = {
  getKpiData: (role, organizationId = null) => {
    const params = { role };
    if (organizationId) params.organization_id = organizationId;
    return axios.get(`${BASE_URL}/kpi/dashboard`, { params }).then(res => res.data);
  },
};

export default KpiDashboardService;
