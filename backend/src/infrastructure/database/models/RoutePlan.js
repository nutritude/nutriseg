const FirestoreModel = require('../FirestoreModel');

class RoutePlan extends FirestoreModel {
    constructor(data = {}) {
        super('route_plans', data);
    }

    static async find(filter = {}) {
        const plans = await super.find('route_plans', filter);
        return plans.map(p => new RoutePlan(p));
    }

    static async findById(id) {
        const data = await super.findById('route_plans', id);
        return data ? new RoutePlan(data) : null;
    }

    get metrics() {
        const { kmStart, kmEnd, visits = [] } = this.data;
        const totalDistance = (kmEnd && kmStart) ? (kmEnd - kmStart) : 0;
        const completedVisits = visits.filter(v => v.status === '#concluido').length;

        return {
            totalDistance,
            progress: visits.length > 0 ? (completedVisits / visits.length) * 100 : 0,
            hasDeviations: false // Lógica de teletransporte virá aqui
        };
    }

    toJSON() {
        return {
            ...this.data,
            _id: this._id,
            ...this.metrics
        };
    }
}

module.exports = RoutePlan;
