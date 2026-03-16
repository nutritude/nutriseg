const WasteLog = require('../../infrastructure/database/models/WasteLog');
const Unit = require('../../infrastructure/database/models/Unit');

class WasteController {
    async create(req, res) {
        try {
            const log = new WasteLog(req.body);
            await log.save();
            res.status(201).json(log);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getByUnit(req, res) {
        try {
            const { unitId } = req.params;
            const logs = await WasteLog.find({ unitId });
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getGlobalStats(req, res) {
        try {
            const logs = await WasteLog.find();
            const totalProduced = logs.reduce((acc, log) => acc + (log.data.weightProduced || 0), 0);
            const totalWaste = logs.reduce((acc, log) => acc + (log.data.weightWaste || 0), 0);
            const totalClean = logs.reduce((acc, log) => acc + (log.data.weightCleanLeftovers || 0), 0);

            res.json({
                totalProduced,
                totalWaste,
                totalClean,
                restoIngestaAvg: totalProduced > 0 ? (totalWaste / totalProduced) * 100 : 0,
                sobraLimpaAvg: totalProduced > 0 ? (totalClean / totalProduced) * 100 : 0
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new WasteController();
