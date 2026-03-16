import api from './api';

class UnitService {
    async getUnits(activeOnly = null) {
        const params = activeOnly !== null ? { active: activeOnly } : {};
        const response = await api.get('/units', { params });
        return response.data;
    }

    async getUnitById(id) {
        const response = await api.get(`/units/${id}`);
        return response.data;
    }

    async createUnit(unitData) {
        const response = await api.post('/units', unitData);
        return response.data;
    }

    async updateUnit(id, unitData) {
        const response = await api.put(`/units/${id}`, unitData);
        return response.data;
    }

    // Soft delete: arquiva a unidade (active=false), mantém no banco
    async deactivateUnit(id) {
        const response = await api.patch(`/units/${id}/deactivate`);
        return response.data;
    }

    // Hard delete: remove permanentemente do banco
    async deleteUnit(id) {
        const response = await api.delete(`/units/${id}`);
        return response.data;
    }

    async getUnitsWithExpiringDocs() {
        const response = await api.get('/units/expiring-docs');
        return response.data;
    }
}

export default new UnitService();
