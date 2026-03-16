import api from './api';

class ChecklistService {
    async getTemplates() {
        const response = await api.get('/checklists/templates');
        return response.data;
    }

    async createTemplate(templateData) {
        const response = await api.post('/checklists/templates', templateData);
        return response.data;
    }

    async getSubmissions() {
        const response = await api.get('/checklists/submissions');
        return response.data;
    }

    async submit(submissionData) {
        const response = await api.post('/checklists/submissions', submissionData);
        return response.data;
    }
}

export default new ChecklistService();
