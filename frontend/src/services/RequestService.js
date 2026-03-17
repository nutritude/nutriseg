import api from './api';

class RequestService {
    async getRequests(unitId = null) {
        const url = unitId ? `/requests?unitId=${unitId}` : '/requests';
        const response = await api.get(url);
        return response.data;
    }

    async createRequest(requestData) {
        const response = await api.post('/requests', requestData);
        return response.data;
    }

    async updateStatus(requestId, status) {
        const response = await api.patch(`/requests/${requestId}/status`, { status });
        return response.data;
    }
}

export default new RequestService();
