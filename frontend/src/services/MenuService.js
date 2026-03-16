import api from './api';

class MenuService {
    async getAll(unitId, date) {
        const params = {};
        if (unitId) params.unitId = unitId;
        if (date) params.date = date;
        const response = await api.get('/menus', { params });
        return response.data;
    }

    async create(menuData) {
        const response = await api.post('/menus', menuData);
        return response.data;
    }

    async updateMealStats(menuId, mealId, statsData) {
        const response = await api.patch(`/menus/${menuId}/meals/${mealId}/stats`, statsData);
        return response.data;
    }
}

export default new MenuService();
