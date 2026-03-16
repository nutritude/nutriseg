import api from './api';

class WasteService {
    async getByUnit(unitId) {
        const response = await api.get(`/waste/unit/${unitId}`);
        return response.data;
    }

    async getStats() {
        const response = await api.get('/waste/stats');
        return response.data;
    }

    async createLog(data) {
        const response = await api.post('/waste', data);
        return response.data;
    }
}

export default new WasteService();
