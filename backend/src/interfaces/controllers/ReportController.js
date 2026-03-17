const Menu = require('../../infrastructure/database/models/Menu');
const Unit = require('../../infrastructure/database/models/Unit');
const Employee = require('../../infrastructure/database/models/Employee');
const { ChecklistSubmission } = require('../../infrastructure/database/models/Checklist');
const Request = require('../../infrastructure/database/models/Request');

class ReportController {
    // Helper to get date filters
    getDateFilter(period, customStart, customEnd) {
        let start = new Date();
        const end = new Date();
        
        switch (period) {
            case 'daily':
                start.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                start.setDate(start.getDate() - 7);
                break;
            case 'monthly':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'custom':
                if (customStart) start = new Date(customStart);
                if (customEnd) end.setTime(new Date(customEnd).getTime());
                break;
            default:
                start.setMonth(start.getMonth() - 1); // Default monthly
        }
        return { start, end };
    }

    // 1. Relatório de Inconformidades Sanitárias
    getNonConformities = async (req, res) => {
        try {
            const { unitId, period, startDate, endDate } = req.query;
            const { start, end } = this.getDateFilter(period, startDate, endDate);
            
            const submissions = await ChecklistSubmission.find();
            const filtered = submissions.filter(s => {
                const date = new Date(s.data.date || s.data.createdAt);
                const matchUnit = !unitId || unitId === 'all' || s.data.unitId === unitId;
                const matchDate = date >= start && date <= end;
                return matchUnit && matchDate;
            });

            const ncList = [];
            filtered.forEach(s => {
                s.data.answers?.forEach(ans => {
                    if (ans.answer === 'NC') {
                        ncList.push({
                            id: s._id,
                            date: s.data.date || s.data.createdAt,
                            unitId: s.data.unitId,
                            question: ans.questionText,
                            comment: ans.comment || 'N/A'
                        });
                    }
                });
            });

            res.json(ncList);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 2. Relatório de Solicitações
    getRequests = async (req, res) => {
        try {
            const { unitId, period, startDate, endDate } = req.query;
            const { start, end } = this.getDateFilter(period, startDate, endDate);
            
            const requests = await Request.find();
            const filtered = requests.filter(r => {
                const date = new Date(r.data.date || r.data.createdAt);
                const matchUnit = !unitId || unitId === 'all' || r.data.unitId === unitId;
                const matchDate = date >= start && date <= end;
                return matchUnit && matchDate;
            });

            res.json(filtered.map(r => ({
                id: r._id,
                ...r.data,
                date: r.data.date || r.data.createdAt
            })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 3. Relatório de Sobra Limpa
    getWasteReport = async (req, res) => {
        try {
            const { unitId, period, startDate, endDate } = req.query;
            const { start, end } = this.getDateFilter(period, startDate, endDate);
            
            const menus = await Menu.find();
            const filtered = menus.filter(m => {
                const date = new Date(m.data.date || m.data.createdAt);
                const matchUnit = !unitId || unitId === 'all' || m.data.unitId === unitId;
                const matchDate = date >= start && date <= end;
                return matchUnit && matchDate;
            });

            const reports = [];
            filtered.forEach(m => {
                m.data.meals?.forEach(meal => {
                    if (meal.stats?.leftoverKg > 0) {
                        reports.push({
                            id: m._id,
                            date: m.data.date,
                            unitId: m.data.unitId,
                            meal: meal.name,
                            sobraLimpa: meal.stats.leftoverKg,
                            produced: meal.stats.producedQty
                        });
                    }
                });
            });

            res.json(reports);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 4. Relatório de Funcionários
    getEmployeesReport = async (req, res) => {
        try {
            const { unitId, status, role } = req.query;
            const employees = await Employee.find();
            
            const filtered = employees.filter(e => {
                const matchUnit = !unitId || unitId === 'all' || e.data.unitId === unitId;
                const matchStatus = !status || status === 'all' || (e.data.status || e.status) === status;
                const matchRole = !role || role === 'all' || e.data.role === role;
                return matchUnit && matchStatus && matchRole;
            });

            res.json(filtered.map(e => e.toJSON()));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 5. Relatório de Performance (Aceitabilidade e Resto-Ingesta)
    getPerformanceReport = async (req, res) => {
        try {
            const { unitId, period, startDate, endDate } = req.query;
            const { start, end } = this.getDateFilter(period, startDate, endDate);
            
            const menus = await Menu.find();
            const filtered = menus.filter(m => {
                const date = new Date(m.data.date || m.data.createdAt);
                const matchUnit = !unitId || unitId === 'all' || m.data.unitId === unitId;
                const matchDate = date >= start && date <= end;
                return matchUnit && matchDate;
            });

            const reports = [];
            filtered.forEach(m => {
                m.data.meals?.forEach(meal => {
                    const stats = meal.stats || {};
                    reports.push({
                        id: m._id,
                        date: m.data.date,
                        unitId: m.data.unitId,
                        meal: meal.name,
                        served: stats.servedQty || 0,
                        contracted: stats.contractedQty || 0,
                        acceptability: stats.contractedQty > 0 ? (stats.servedQty / stats.contractedQty) * 100 : 0,
                        restIngesta: stats.restIngestaKg || 0,
                        percentRest: stats.servedQty > 0 ? (stats.restIngestaKg / (stats.servedQty * 0.5)) * 100 : 0
                    });
                });
            });

            res.json(reports);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ReportController();
