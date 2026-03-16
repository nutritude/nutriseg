const TemperatureLog = require('../../infrastructure/database/models/TemperatureLog');
const Unit = require('../../infrastructure/database/models/Unit');

class TemperatureController {
    // Create new temperature log
    async createLog(req, res) {
        try {
            const logData = req.body;
            const log = new TemperatureLog(logData);
            await log.save();
            res.status(201).json({ message: 'Registro criado com sucesso', log });
        } catch (error) {
            console.error('[CREATE LOG ERROR]', error);
            res.status(400).json({ error: error.message });
        }
    }

    // Get all temperature logs with filters
    async getLogs(req, res) {
        try {
            const { unitId, date, shift, category, nonCompliantOnly } = req.query;
            const filter = {};
            if (unitId) filter.unitId = unitId;
            if (shift) filter.shift = shift;
            if (category) filter.category = category;
            // No Firestore, filtros de data complexos requerem índices. 
            // Para maior compatibilidade, faremos filtro exato ou usaremos o date se for string
            if (date) filter.date = date;

            let logs = await TemperatureLog.find(filter);

            // Manual sort & populate
            logs.sort((a, b) => new Date(b.data.measurementTime || 0) - new Date(a.data.measurementTime || 0));
            for (let log of logs) {
                if (log.data.unitId) log.unitId = await Unit.findById(log.data.unitId);
            }

            if (nonCompliantOnly === 'true') {
                logs = logs.filter(log => !log.data.isCompliant);
            }

            res.json({ count: logs.length, logs });
        } catch (error) {
            console.error('[GET LOGS ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar registros' });
        }
    }

    async getLogsByUnit(req, res) {
        try {
            const { unitId } = req.params;
            const logs = await TemperatureLog.find({ unitId });
            // Sort por data decrescente
            logs.sort((a, b) => new Date(b.data?.measurementTime || 0) - new Date(a.data?.measurementTime || 0));
            res.json(logs);
        } catch (error) {
            console.error('[GET LOGS BY UNIT ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar registros da unidade' });
        }
    }

    getNonCompliantLogs = async (req, res) => {
        try {
            let logs = await TemperatureLog.find({ isCompliant: false });
            // sort manually
            logs.sort((a, b) => new Date(b.data?.measurementTime || 0) - new Date(a.data?.measurementTime || 0));
            // populate unitId
            for (let log of logs) {
                if (log.data?.unitId) {
                    log.unitId = await Unit.findById(log.data.unitId);
                }
            }
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar não conformes' });
        }
    }

    generateReport = async (req, res) => {
        try {
            res.json({ message: 'Relatório gerado (stub)' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao gerar' });
        }
    }

    updateLog = async (req, res) => {
        try {
            const { id } = req.params;
            const log = await TemperatureLog.findByIdAndUpdate(id, req.body);
            if (!log) return res.status(404).json({ error: 'Registro não encontrado' });
            res.json({ message: 'Registro atualizado', log });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    deleteLog = async (req, res) => {
        try {
            const { id } = req.params;
            await TemperatureLog.findByIdAndDelete(id);
            res.json({ message: 'Registro deletado' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao deletar' });
        }
    }
}

module.exports = new TemperatureController();
