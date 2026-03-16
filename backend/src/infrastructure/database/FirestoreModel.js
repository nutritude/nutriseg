const { db } = require('./firebase-admin');

class FirestoreModel {
    static async deleteMany(collectionName, filter = {}) {
        const collection = db.collection(collectionName);
        const snapshot = await collection.get();
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return { deletedCount: snapshot.size };
    }

    async delete() {
        if (this._id) {
            await db.collection(this.collectionName).doc(this._id).delete();
        }
    }

    constructor(collectionName, data = {}) {
        this.collectionName = collectionName;
        this.data = { ...data };
        this._id = data._id || data.id || null;
    }

    static async find(collectionName, filter = {}) {
        let query = db.collection(collectionName);

        Object.keys(filter).forEach(key => {
            if (typeof filter[key] !== 'object') {
                query = query.where(key, '==', filter[key]);
            }
        });

        const snapshot = await query.get();
        const results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            results.push({ ...data, _id: doc.id, id: doc.id });
        });
        return results;
    }

    static async findById(collectionName, id) {
        if (!id) return null;
        try {
            const doc = await db.collection(collectionName).doc(id).get();
            if (!doc.exists) return null;
            return { ...doc.data(), _id: doc.id, id: doc.id };
        } catch (e) {
            return null;
        }
    }

    static async findByIdAndUpdate(collectionName, id, updateData) {
        const docRef = db.collection(collectionName).doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return null;

        const newData = { ...doc.data(), ...updateData, updatedAt: new Date() };
        await docRef.set(newData, { merge: true });
        return { ...newData, _id: id, id: id };
    }

    static async findByIdAndDelete(collectionName, id) {
        const docRef = db.collection(collectionName).doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return null;
        await docRef.delete();
        return { _id: id };
    }

    async save() {
        const collection = db.collection(this.collectionName);
        const cleanedData = { ...this.data };
        delete cleanedData._id;
        delete cleanedData.id;

        if (this._id) {
            await collection.doc(this._id).set({ ...cleanedData, updatedAt: new Date() }, { merge: true });
        } else {
            const docRef = await collection.add({
                ...cleanedData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            this._id = docRef.id;
            this.data._id = docRef.id;
            this.data.id = docRef.id;
        }
        return this;
    }

    // Método auxiliar para facilitar o "Populate" manual nos Controllers
    async populate(fieldName, targetModel) {
        if (this.data[fieldName]) {
            const related = await targetModel.findById(this.data[fieldName]);
            this[fieldName] = related; // Atribui à instância
            return related;
        }
        return null;
    }

    toJSON() {
        const json = { ...this.data, _id: this._id, id: this._id };
        // Adiciona/Sobrescreve com campos populados da instância
        Object.keys(this).forEach(key => {
            if (!['data', 'collectionName', '_id', 'id'].includes(key) && this[key] !== undefined) {
                json[key] = (this[key] && typeof this[key].toJSON === 'function')
                    ? this[key].toJSON()
                    : this[key];
            }
        });
        return json;
    }
}

module.exports = FirestoreModel;
