import api from './api';

class EventService {
    async getEvents(filters = {}) {
        const response = await api.get('/events', { params: filters });
        return response.data;
    }

    async createEvent(eventData) {
        const response = await api.post('/events', eventData);
        return response.data;
    }

    async updateEvent(eventId, eventData) {
        const response = await api.put(`/events/${eventId}`, eventData);
        return response.data;
    }

    async deleteEvent(eventId) {
        const response = await api.delete(`/events/${eventId}`);
        return response.data;
    }

    async getMaterialsAvailability(date) {
        const response = await api.get('/events/materials/availability', { params: { date } });
        return response.data;
    }

    async updateChecklist(eventId, data) {
        const response = await api.patch(`/events/${eventId}/checklist`, data);
        return response.data;
    }

    async getBIStats() {
        const response = await api.get('/events/stats/bi');
        return response.data;
    }
}

export default new EventService();
