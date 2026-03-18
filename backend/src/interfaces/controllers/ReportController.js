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
                    
                    // Acha o prato com maior rejeição/desperdício
                    let worstDishName = 'Sem Dados';
                    let maxWaste = 0;
                    let wasteType = '';

                    if (meal.dishes && meal.dishes.length > 0) {
                        meal.dishes.forEach(d => {
                            const rKg = Number(d.operational?.restoKg) || 0;
                            const sKg = Number(d.operational?.cleanLeftoverKg) || 0;
                            const totalWaste = rKg + sKg;
                            
                            if (totalWaste > maxWaste) {
                                maxWaste = totalWaste;
                                worstDishName = d.name;
                                wasteType = rKg > sKg ? 'Resto-Ingesta Alta' : 'Sobra Limpa Alta';
                            }
                        });
                    }

                    reports.push({
                        id: m._id,
                        date: m.data.date,
                        unitId: m.data.unitId,
                        meal: meal.name,
                        served: stats.servedQty || 0,
                        contracted: stats.contractedQty || 0,
                        acceptability: stats.contractedQty > 0 ? (stats.servedQty / stats.contractedQty) * 100 : 0,
                        restIngesta: stats.restIngestaKg || 0,
                        percentRest: stats.servedQty > 0 ? (stats.restIngestaKg / (stats.servedQty * 0.5)) * 100 : 0,
                        cookOnDuty: stats.cookOnDuty || 'Não Informado',
                        worstFood: maxWaste > 0 ? { name: worstDishName, kg: maxWaste.toFixed(1), type: wasteType } : null
                    });
                });
            });

            res.json(reports);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // 6. Relatório Preditivo de Termometria
    getTemperaturesReport = async (req, res) => {
        try {
            const { unitId, period, startDate, endDate } = req.query;
            const { start, end } = this.getDateFilter(period, startDate, endDate);
            
            const menus = await Menu.find();
            const filteredMenus = menus.filter(m => {
                const date = new Date(m.data.date || m.data.createdAt);
                const matchUnit = !unitId || unitId === 'all' || m.data.unitId === unitId;
                const matchDate = date >= start && date <= end;
                return matchUnit && matchDate;
            });

            const reports = [];
            filteredMenus.forEach(m => {
                m.data.meals?.forEach(meal => {
                    meal.dishes?.forEach(dish => {
                        if (dish.safety?.actualTemp || dish.safety?.arrivalTemp) {
                            
                            // Validate rules manually or duplicate logic from UI
                            const cat = String(dish.category || '').toLowerCase().trim();
                            const name = String(dish.name || '').toLowerCase().trim();
                            let isFrozen = name.includes('sorvete') || name.includes('picolé') || name.includes('gelo') || cat.includes('congelado');
                            let isHot = cat === 'principal' || cat === 'guarnição' || cat === 'guarnicao' || cat === 'quente' || cat === 'sopa' || cat === 'prato quente' || name.includes('arroz') || name.includes('feijão') || name.includes('carne') || name.includes('frango') || name.includes('peixe') || name.includes('purê') || name.includes('macarrão') || name.includes('refogado') || name.includes('assado') || name.includes('cozido');
                            
                            const serviceTemp = parseFloat(dish.safety.actualTemp);
                            const arrivalTemp = parseFloat(dish.safety.arrivalTemp);

                            let serviceDeviant = false;
                            if (isHot) {
                                serviceDeviant = serviceTemp > 0 && serviceTemp < 60;
                            } else if (isFrozen) {
                                serviceDeviant = serviceTemp > -12;
                            } else {
                                serviceDeviant = serviceTemp > 10;
                            }

                            // Push formatted log
                            reports.push({
                                id: m._id + dish.id,
                                date: dish.safety.measuredAt || m.data.date || m.data.createdAt,
                                unitId: m.data.unitId,
                                meal: meal.name,
                                item: dish.name,
                                category: dish.category,
                                regime: isHot ? 'Quente' : (isFrozen ? 'Congelado' : 'Frio'),
                                targetTemp: isHot ? '≥ 60°C' : (isFrozen ? '≤ -12°C' : '≤ 10°C'),
                                actualTemp: dish.safety.actualTemp,
                                arrivalTemp: dish.safety.arrivalTemp,
                                isCompliant: !serviceDeviant,
                                auditor: dish.safety.auditor || 'Não Identificado',
                                deviationReason: dish.safety.deviationReason || null,
                                correctiveAction: dish.safety.correctiveAction || null,
                                hasCorrectiveAction: !!dish.safety.correctiveAction
                            });
                        }
                    });
                });
            });

            // Sort by most recent
            reports.sort((a, b) => new Date(b.date) - new Date(a.date));

            res.json(reports);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ReportController();
