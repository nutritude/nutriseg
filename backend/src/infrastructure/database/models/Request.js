const FirestoreModel = require('../FirestoreModel');

class Request extends FirestoreModel {
    constructor(data = {}) {
        super('requests', data);
    }

    static async find(filter = {}) {
        const results = await super.find('requests', filter);
        return results.map(r => new Request(r));
    }

    static async findById(id) {
        const data = await super.findById('requests', id);
        return data ? new Request(data) : null;
    }

    static async findByIdAndUpdate(id, updateData) {
        const data = await super.findByIdAndUpdate('requests', id, updateData);
        return data ? new Request(data) : null;
    }

    static async findByIdAndDelete(id) {
        return await super.findByIdAndDelete('requests', id);
    }
}

module.exports = Request;
