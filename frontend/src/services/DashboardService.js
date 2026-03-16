import api from './api';

class DashboardService {
    async getKpis(unitId) {
        const response = await api.get('/dashboard/kpis', {
            params: { unitId }
        });
        return response.data;
    }
}

export default new DashboardService();
