const FirestoreModel = require('../FirestoreModel');
class Sample extends FirestoreModel {
    constructor(data = {}) { super('samples', data); }
    static async find(filter = {}) { return (await super.find('samples', filter)).map(m => new Sample(m)); }
    static async findById(id) { const data = await super.findById('samples', id); return data ? new Sample(data) : null; }
    static async findByIdAndUpdate(id, updateData) { const data = await super.findByIdAndUpdate('samples', id, updateData); return data ? new Sample(data) : null; }
    static async findByIdAndDelete(id) { return await super.findByIdAndDelete('samples', id); }
}
module.exports = Sample;
