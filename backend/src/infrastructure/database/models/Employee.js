const FirestoreModel = require('../FirestoreModel');

class Employee extends FirestoreModel {
    constructor(data = {}) {
        super('employees', data);
    }

    static async find(filter = {}) {
        const employees = await super.find('employees', filter);
        return employees.map(e => new Employee(e));
    }

    static async findById(id) {
        const data = await super.findById('employees', id);
        return data ? new Employee(data) : null;
    }

    static async findByIdAndUpdate(id, updateData) {
        const data = await super.findByIdAndUpdate('employees', id, updateData);
        return data ? new Employee(data) : null;
    }

    static async findByIdAndDelete(id) {
        return await super.findByIdAndDelete('employees', id);
    }

    get healthCompliance() {
        if (!this.data.hasFoodContact) return { status: 'Apto (Geral)', color: 'green', tag: '#apto' };
        if (!this.data.health) return { status: 'Sem Dados', color: 'gray', tag: '#pendente' };

        const now = new Date();
        const fifteenDaysFromNow = new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000));
        const twelveMonthsAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

        const health = this.data.health;

        const checkExam = (date) => {
            if (!date) return 'Missing';
            const d = new Date(date);
            const expiration = new Date(d.getTime() + (365 * 24 * 60 * 60 * 1000));
            if (expiration < now) return 'Expired';
            if (expiration < fifteenDaysFromNow) return 'ExpiringSoon';
            return 'Valid';
        };

        const results = {
            aso: checkExam(health.lastASO),
            training: checkExam(health.hygieneTrainingDate),
            copro: checkExam(health.coprocultureDate)
        };

        const hasExpired = Object.values(results).includes('Expired');
        const hasWarning = Object.values(results).includes('ExpiringSoon');

        return {
            status: hasExpired ? 'Inapto' : (hasWarning ? 'Atenção' : 'Apto'),
            color: hasExpired ? 'red' : (hasWarning ? 'orange' : 'green'),
            tag: hasExpired ? '#vencido' : (hasWarning ? '#atencao' : '#em_dia'),
            details: results
        };
    }

    toJSON() {
        return {
            ...super.toJSON(),
            healthCompliance: this.healthCompliance
        };
    }
}

module.exports = Employee;
