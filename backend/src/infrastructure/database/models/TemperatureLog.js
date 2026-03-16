const FirestoreModel = require('../FirestoreModel');

class TemperatureLog extends FirestoreModel {
    constructor(data = {}) {
        super('temperatureLogs', data);
    }

    static async find(filter = {}) {
        const logs = await super.find('temperatureLogs', filter);
        return logs.map(m => new TemperatureLog(m));
    }

    static async findById(id) {
        const data = await super.findById('temperatureLogs', id);
        return data ? new TemperatureLog(data) : null;
    }

    get isCompliant() {
        const { temperature, category } = this.data;
        if (!temperature) return true;

        // Regras CVS 5 / RDC 216
        if (category === 'Quente' && temperature < 60) return false;
        if (category === 'Frio' && temperature > 10) return false;

        return true;
    }

    get needsCorrectiveAction() {
        return !this.isCompliant && !this.data.correctiveAction;
    }

    toJSON() {
        return {
            ...this.data,
            _id: this._id,
            id: this._id,
            isCompliant: this.isCompliant,
            needsCorrectiveAction: this.needsCorrectiveAction,
            status: this.isCompliant ? '#conforme' : '#critico'
        };
    }
}

module.exports = TemperatureLog;
