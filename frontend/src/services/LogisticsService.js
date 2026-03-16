import api from './api';

class LogisticsService {
    async planDay(payload) {
        const response = await api.post('/logistics/plan', payload);
        return response.data;
    }

    async startRoute(id, kmStart, photoStart) {
        const response = await api.patch(`/logistics/plan/${id}/start`, { kmStart, photoStart });
        return response.data;
    }

    async checkIn(id, unitId, lat, lng) {
        const response = await api.patch(`/logistics/plan/${id}/unit/${unitId}/checkin`, { lat, lng });
        return response.data;
    }

    async finishDay(id, kmEnd, photoEnd) {
        const response = await api.patch(`/logistics/plan/${id}/finish`, { kmEnd, photoEnd });
        return response.data;
    }

    async registerToll(planId, value, receiptPhoto) {
        const response = await api.post('/logistics/tolls', { planId, value, receiptPhoto });
        return response.data;
    }
}

export default new LogisticsService();
