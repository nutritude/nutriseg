const RoutePlan = require('../../infrastructure/database/models/RoutePlan');
const Unit = require('../../infrastructure/database/models/Unit');
const FinancialLog = require('../../infrastructure/database/models/FinancialLog');

class LogisticsController {
    async planDay(req, res) {
        try {
            const { units, date, startLocation, extraStops } = req.body;
            // units: array de { unitId, order }

            const newPlan = new RoutePlan({
                units,
                startLocation, // { lat, lng, name }
                extraStops: extraStops || [], // [ { name, location: {lat, lng} } ]
                date: date || new Date().toISOString().split('T')[0],
                status: '#planejado',
                visits: units.map(u => ({
                    unitId: u.unitId,
                    order: u.order,
                    status: '#pendente'
                }))
            });

            await newPlan.save();
            res.status(201).json(newPlan.toJSON());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async startRoute(req, res) {
        try {
            const { id } = req.params;
            const { kmStart, photoStart } = req.body;

            const plan = await RoutePlan.findById(id);
            if (!plan) return res.status(404).json({ error: 'Roteiro não encontrado' });

            plan.data.kmStart = kmStart;
            plan.data.photoStart = photoStart;
            plan.data.startTime = new Date();
            plan.data.status = '#viagem_iniciada'; // Tag minúscula

            await plan.save();
            res.json(plan.toJSON());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async checkIn(req, res) {
        try {
            const { id, unitId } = req.params;
            const { lat, lng } = req.body;

            const plan = await RoutePlan.findById(id);
            const unit = await Unit.findById(unitId);

            if (!plan || !unit) return res.status(404).json({ error: 'Dados inválidos' });

            // Validação de Geofencing (100 metros)
            const isNear = unit.isWithinRange(lat, lng, 100);
            if (!isNear) {
                return res.status(403).json({
                    error: 'Você precisa estar na unidade para iniciar a vistoria.',
                    tag: '#fraude_distancia'
                });
            }

            // Registro silencioso do check-in
            const visitIdx = plan.data.visits.findIndex(v => v.unitId === unitId);
            plan.data.visits[visitIdx] = {
                ...plan.data.visits[visitIdx],
                status: '#em_transito',
                checkInTime: new Date(),
                coords: { lat, lng },
                tag: '#checkin'
            };

            await plan.save();
            res.json({ message: 'Check-in realizado com sucesso', visit: plan.data.visits[visitIdx] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async registerToll(req, res) {
        try {
            const { planId, value, receiptPhoto } = req.body;

            const log = new FinancialLog({
                planId,
                type: 'Pedágio',
                value: Number(value),
                receiptPhoto,
                date: new Date(),
                tag: '#pedagio_em_transito'
            });

            await log.save();
            res.status(201).json(log.toJSON());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async finishDay(req, res) {
        try {
            const { id } = req.params;
            const { kmEnd, photoEnd } = req.body;

            const plan = await RoutePlan.findById(id);
            if (!plan) return res.status(404).json({ error: 'Roteiro não encontrado' });

            plan.data.kmEnd = kmEnd;
            plan.data.photoEnd = photoEnd;
            plan.data.endTime = new Date();
            plan.data.status = '#visita_concluida';

            // Anti-fraude: Detecção de Teletransporte
            // (Lógica simples: verifica se o tempo de execução foi humano)
            const durationMin = (new Date() - new Date(plan.data.startTime)) / (1000 * 60);
            if (durationMin < 30 && plan.data.visits.length > 2) {
                plan.data.tag = '#suspenda_reembolso';
            }

            await plan.save();
            res.json(plan.toJSON());
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getWeeklySummary(req, res) {
        try {
            const plans = await RoutePlan.find({ status: '#visita_concluida' });
            const totalKm = plans.reduce((acc, p) => acc + (p.data.kmEnd - p.data.kmStart), 0);

            res.json({
                totalKm,
                reimbursementBase: totalKm * 0.45,
                tag: '#pendente_reembolso'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new LogisticsController();
