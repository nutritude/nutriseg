const FirestoreModel = require('../FirestoreModel');

class WasteLog extends FirestoreModel {
    constructor(data = {}) {
        super('waste_logs', data);
    }

    static async find(filter = {}) {
        const logs = await super.find('waste_logs', filter);
        return logs.map(l => new WasteLog(l));
    }

    static async findById(id) {
        const data = await super.findById('waste_logs', id);
        return data ? new WasteLog(data) : null;
    }

    // Fórmulas automáticas de % de Resto-Ingesta e Sobra Limpa
    get metrics() {
        const { weightProduced, weightWaste, weightCleanLeftovers, guestCount } = this.data;

        const restoIngestaPercent = weightProduced > 0 ? (weightWaste / weightProduced) * 100 : 0;
        const sobraLimpaPercent = weightProduced > 0 ? (weightCleanLeftovers / weightProduced) * 100 : 0;
        const perCapitaWaste = guestCount > 0 ? (weightWaste / guestCount) * 1000 : 0; // em gramas

        return {
            restoIngestaPercent: parseFloat(restoIngestaPercent.toFixed(2)),
            sobraLimpaPercent: parseFloat(sobraLimpaPercent.toFixed(2)),
            perCapitaWaste: parseFloat(perCapitaWaste.toFixed(2)),
            status: restoIngestaPercent > 10 ? '#critico' : '#conformidade'
        };
    }

    toJSON() {
        return {
            ...this.data,
            _id: this._id,
            id: this._id,
            ...this.metrics
        };
    }
}

module.exports = WasteLog;
