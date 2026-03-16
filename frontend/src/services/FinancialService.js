import api from './api';

class FinancialService {
    async getByUnit(unitId) {
        const response = await api.get(`/financial/unit/${unitId}`);
        return response.data;
    }

    async getSummary() {
        const response = await api.get('/financial/summary');
        return response.data;
    }

    async createLog(data) {
        const response = await api.post('/financial', data);
        return response.data;
    }
}

export default new FinancialService();
