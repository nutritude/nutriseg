const FirestoreModel = require('../FirestoreModel');

class DecorationItem extends FirestoreModel {
    constructor(data = {}) {
        super('decoration_items', data);
    }

    static async find(filter = {}) {
        const results = await super.find('decoration_items', filter);
        return results.map(r => new DecorationItem(r));
    }

    static async findById(id) {
        const data = await super.findById('decoration_items', id);
        return data ? new DecorationItem(data) : null;
    }

    static async findByIdAndUpdate(id, updateData) {
        const data = await super.findByIdAndUpdate('decoration_items', id, updateData);
        return data ? new DecorationItem(data) : null;
    }

    static async findByIdAndDelete(id) {
        return await super.findByIdAndDelete('decoration_items', id);
    }
}

module.exports = DecorationItem;
