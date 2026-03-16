const FirestoreModel = require('../FirestoreModel');

class FinancialLog extends FirestoreModel {
    constructor(data = {}) {
        super('financial_logs', data);
    }

    static async find(filter = {}) {
        const logs = await super.find('financial_logs', filter);
        return logs.map(l => new FinancialLog(l));
    }

    static async findById(id) {
        const data = await super.findById('financial_logs', id);
        return data ? new FinancialLog(data) : null;
    }

    get summary() {
        const { kmStart, kmEnd, tollValue = 0, kmRate = 0 } = this.data;
        const kmDriven = (kmEnd && kmStart) ? (kmEnd - kmStart) : 0;
        const reimbursementValue = (kmDriven * kmRate) + tollValue;

        return {
            kmDriven,
            reimbursementValue: parseFloat(reimbursementValue.toFixed(2)),
            status: '#pendente'
        };
    }

    toJSON() {
        return {
            ...this.data,
            _id: this._id,
            id: this._id,
            ...this.summary
        };
    }
}

module.exports = FinancialLog;
