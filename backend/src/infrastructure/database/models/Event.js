const FirestoreModel = require('../FirestoreModel');

class Event extends FirestoreModel {
    constructor(data = {}) {
        super('events', data);
    }

    static async find(filter = {}) {
        const results = await super.find('events', filter);
        return results.map(r => new Event(r));
    }

    static async findById(id) {
        const data = await super.findById('events', id);
        return data ? new Event(data) : null;
    }

    static async findByIdAndUpdate(id, updateData) {
        const data = await super.findByIdAndUpdate('events', id, updateData);
        return data ? new Event(data) : null;
    }

    static async findByIdAndDelete(id) {
        return await super.findByIdAndDelete('events', id);
    }
}

module.exports = Event;
