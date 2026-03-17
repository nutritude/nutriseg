import api from './api';

class EmployeeService {
    // activeOnly: true = só ativos, false = só inativos, null = todos
    async getAllEmployees(activeOnly = true) {
        const params = {};
        if (activeOnly !== null) params.active = activeOnly;
        
        const response = await api.get('/employees', { params });
        return response.data;
    }

    async getEmployeesByUnit(unitId, activeOnly = true) {
        const params = {};
        if (activeOnly !== null) params.active = activeOnly;
        
        const response = await api.get(`/employees/unit/${unitId}`, { params });
        return response.data;
    }

    async getEmployeeById(id) {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    }

    async createEmployee(employeeData) {
        const response = await api.post('/employees', employeeData);
        return response.data;
    }

    async updateEmployee(id, employeeData) {
        const response = await api.put(`/employees/${id}`, employeeData);
        return response.data;
    }

    // Soft delete: arquiva o colaborador (active=false), mantém no banco
    async deactivateEmployee(id, reason = 'Outros') {
        const response = await api.patch(`/employees/${id}/deactivate`, { reason });
        return response.data;
    }

    // Reactivate employee
    async reactivateEmployee(id) {
        const response = await api.patch(`/employees/${id}/reactivate`);
        return response.data;
    }

    // Hard delete: remove permanentemente do banco
    async deleteEmployee(id) {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    }

    async getEmployeesWithHealthIssues(unitId = null) {
        const response = await api.get('/employees/health-issues', {
            params: unitId ? { unitId } : {}
        });
        return response.data;
    }
}

export default new EmployeeService();
