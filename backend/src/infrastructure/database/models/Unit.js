const FirestoreModel = require('../FirestoreModel');

class Unit extends FirestoreModel {
    constructor(data = {}) {
        super('units', data);
    }

    static async find(filter = {}) {
        const units = await super.find('units', filter);
        return units.map(u => new Unit(u));
    }

    static async findById(id) {
        const data = await super.findById('units', id);
        return data ? new Unit(data) : null;
    }

    // Geofencing: Validação de localização para início de auditoria
    isWithinRange(userLat, userLng) {
        const uLat = this.data.location?.latitude || this.data.location?.lat;
        const uLng = this.data.location?.longitude || this.data.location?.lng;

        if (!uLat || !uLng) return true; // Se não configurado, permite

        const R = 6371e3; // metros
        const φ1 = userLat * Math.PI / 180;
        const φ2 = uLat * Math.PI / 180;
        const Δλ = (uLng - userLng) * Math.PI / 180;

        const d = Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ)) * R;
        return d <= 100; // Raio rigoroso de 100 metros (CVS 5 Compliance)
    }

    get documentationStatus() {
        const docs = this.data.sanitaryDocs || [];
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        const expired = docs.filter(doc => doc.expirationDate && new Date(doc.expirationDate) < now);
        const warning = docs.filter(doc =>
            doc.expirationDate &&
            new Date(doc.expirationDate) >= now &&
            new Date(doc.expirationDate) <= thirtyDaysFromNow
        );

        return {
            hasExpired: expired.length > 0,
            hasWarning: warning.length > 0,
            expiredDocs: expired.map(d => d.type),
            status: expired.length > 0 ? '#irregular' : (warning.length > 0 ? '#atencao' : '#regular')
        };
    }

    toJSON() {
        return {
            ...this.data,
            _id: this._id,
            id: this._id,
            documentationStatus: this.documentationStatus,
            typeTag: this.data.type === 'Transportada' ? '#transportada' : '#local'
        };
    }
}

module.exports = Unit;
