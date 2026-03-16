const FirestoreModel = require('../FirestoreModel');
class ChecklistTemplate extends FirestoreModel {
    constructor(data = {}) { super('checklists_templates', data); }
    static async find(filter = {}) { return (await super.find('checklists_templates', filter)).map(m => new ChecklistTemplate(m)); }
    static async findById(id) { const data = await super.findById('checklists_templates', id); return data ? new ChecklistTemplate(data) : null; }
    static async findByIdAndUpdate(id, updateData) { const data = await super.findByIdAndUpdate('checklists_templates', id, updateData); return data ? new ChecklistTemplate(data) : null; }
    static async findByIdAndDelete(id) { return await super.findByIdAndDelete('checklists_templates', id); }
}

class ChecklistSubmission extends FirestoreModel {
    constructor(data = {}) { super('checklists_submissions', data); }
    static async find(filter = {}) { return (await super.find('checklists_submissions', filter)).map(m => new ChecklistSubmission(m)); }
    static async findById(id) { const data = await super.findById('checklists_submissions', id); return data ? new ChecklistSubmission(data) : null; }
    static async findByIdAndUpdate(id, updateData) { const data = await super.findByIdAndUpdate('checklists_submissions', id, updateData); return data ? new ChecklistSubmission(data) : null; }
    static async findByIdAndDelete(id) { return await super.findByIdAndDelete('checklists_submissions', id); }
}

module.exports = { ChecklistTemplate, ChecklistSubmission };
