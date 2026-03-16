const FinancialLog = require('../../infrastructure/database/models/FinancialLog');

class FinancialController {
    async create(req, res) {
        try {
            const log = new FinancialLog(req.body);
            await log.save();
            res.status(201).json(log);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getByUnit(req, res) {
        try {
            const { unitId } = req.params;
            const logs = await FinancialLog.find({ unitId });
            res.json(logs);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getReimbursementSummary(req, res) {
        try {
            const logs = await FinancialLog.find();
            const totalToReimburse = logs.reduce((acc, log) => acc + (log.summary.reimbursementValue || 0), 0);
            res.json({ totalToReimburse });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new FinancialController();
