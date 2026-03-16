const FirestoreModel = require('../FirestoreModel');

class Menu extends FirestoreModel {
    constructor(data = {}) {
        super('menus', data);
    }
    static async find(filter = {}) { return (await super.find('menus', filter)).map(m => new Menu(m)); }
    static async findById(id) { const data = await super.findById('menus', id); return data ? new Menu(data) : null; }
    static async findByIdAndUpdate(id, updateData) { const data = await super.findByIdAndUpdate('menus', id, updateData); return data ? new Menu(data) : null; }
    static async findByIdAndDelete(id) { return await super.findByIdAndDelete('menus', id); }
}

module.exports = Menu;
