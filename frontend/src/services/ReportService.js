import api from './api';

class ReportService {
    async getNonConformities(params) {
        const response = await api.get('/reports/non-conformities', { params });
        return response.data;
    }

    async getRequests(params) {
        const response = await api.get('/reports/requests', { params });
        return response.data;
    }

    async getWasteReport(params) {
        const response = await api.get('/reports/waste', { params });
        return response.data;
    }

    async getEmployeesReport(params) {
        const response = await api.get('/reports/employees', { params });
        return response.data;
    }

    async getPerformanceReport(params) {
        const response = await api.get('/reports/performance', { params });
        return response.data;
    }
}

export default new ReportService();
