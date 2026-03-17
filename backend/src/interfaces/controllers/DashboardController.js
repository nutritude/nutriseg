const Menu = require('../../infrastructure/database/models/Menu');
const Unit = require('../../infrastructure/database/models/Unit');
const TemperatureLog = require('../../infrastructure/database/models/TemperatureLog');
const Sample = require('../../infrastructure/database/models/Sample');
const Employee = require('../../infrastructure/database/models/Employee');
const { ChecklistSubmission } = require('../../infrastructure/database/models/Checklist');

class DashboardController {
    getKpis = async (req, res) => {
        try {
            const { unitId } = req.query;
            const filter = (unitId && unitId !== 'all') ? { unitId } : {};

            // 1. Métricas de Desperdício e Operação
            const menus = await Menu.find(filter);
            let totalServed = 0, totalContracted = 0, totalRestIngesta = 0;

            menus.forEach(menu => {
                if (menu.data.meals) {
                    menu.data.meals.forEach(meal => {
                        if (meal.stats) {
                            totalServed += meal.stats.servedQty || 0;
                            totalContracted += meal.stats.contractedQty || 0;
                            totalRestIngesta += meal.stats.restIngestaKg || 0;
                        }
                    });
                }
            });

            // 2. Radar Sanitário (CVS 5) - Agregação Real por Categorias (Simulada por Keywords ou Real se disponível)
            const submissions = await ChecklistSubmission.find(filter);
            const radarData = {
                estrutura: 0,
                higiene: 0,
                temperaturas: 0,
                documentacao: 0,
                pragas: 0
            };

            const structuralNonCompliances = [];

            if (submissions.length > 0) {
                const categories = {
                    estrutura: ['parede', 'piso', 'teto', 'iluminação', 'ventilação', 'estrutura', 'manutenção', 'instalação', 'equipamento', 'fiação', 'porta', 'janela'],
                    higiene: ['lavagem', 'limpeza', 'sanitização', 'higiene', 'uniforme', 'mãos', 'barba', 'unhas', 'touca', 'luva', 'detergente', 'esponja', 'lixo'],
                    temperaturas: ['temperatura', 'geladeira', 'freezer', 'balcão', 'quente', 'frio', 'congelamento', 'refrigeração', 'termômetro', 'monitoramento'],
                    documentacao: ['documento', 'planilha', 'laudo', 'alvará', 'manual', 'procedimento', 'registro', 'pop', 'pgr', 'aso', 'treinamento'],
                    pragas: ['praga', 'inseto', 'rato', 'barata', 'dedetização', 'ralo', 'tela', 'formiga']
                };

                const scores = { estrutura: [], higiene: [], temperaturas: [], documentacao: [], pragas: [] };

                submissions.forEach(s => {
                    const answers = s.data.answers || [];
                    answers.forEach(a => {
                        const text = (a.questionText || '').toLowerCase();
                        const answer = a.answer; // 'C', 'NC', 'NA'
                        if (answer === 'NA') return;

                        let categorized = false;
                        for (const [cat, keywords] of Object.entries(categories)) {
                            if (keywords.some(kw => text.includes(kw))) {
                                scores[cat].push(answer === 'C' ? 100 : 0);
                                categorized = true;
                                
                                if (cat === 'estrutura' && answer === 'NC') {
                                    structuralNonCompliances.push({
                                        unitId: s.data.unitId,
                                        question: a.questionText,
                                        date: s.data.date
                                    });
                                }
                            }
                        }
                        // Se não categorizou, joga em higiene como fallback (mais comum)
                        if (!categorized) scores.higiene.push(answer === 'C' ? 100 : 0);
                    });
                });

                Object.keys(radarData).forEach(cat => {
                    const catScores = scores[cat];
                    if (catScores.length > 0) {
                        radarData[cat] = Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length);
                    } else {
                        radarData[cat] = 85; // Default otimista se não houver dados específicos
                    }
                });
            } else {
                radarData.estrutura = 75; radarData.higiene = 80; radarData.temperaturas = 65; radarData.documentacao = 50; radarData.pragas = 95;
            }

            // 3. Unidades e Heatmap (Conformidade Real por Unidade)
            const units = await Unit.find();
            const heatmap = units.map(u => {
                const unitSubmissions = submissions.filter(s => s.data.unitId === u._id);
                let score = 70; // Base
                if (unitSubmissions.length > 0) {
                    const total = unitSubmissions.reduce((acc, s) => acc + (s.data.answers?.length || 0), 0);
                    const compliant = unitSubmissions.reduce((acc, s) => acc + (s.data.answers?.filter(a => a.answer === 'C').length || 0), 0);
                    score = total > 0 ? (compliant / total) * 100 : 70;
                }
                return {
                    id: u._id,
                    name: u.data.name,
                    lat: u.data.location?.latitude || u.data.location?.lat,
                    lng: u.data.location?.longitude || u.data.location?.lng,
                    ics: Math.round(score),
                    status: '#heatmap'
                };
            }).filter(h => h.lat && h.lng);

            // 3.1 Agregação de Inconformidades Estruturais por Unidade
            const structuralIssuesByUnit = units.map(u => {
                const issues = structuralNonCompliances.filter(i => i.unitId === u._id);
                return {
                    id: u._id,
                    name: u.data.name,
                    count: issues.length,
                    issues: issues.slice(0, 3).map(i => i.question)
                };
            }).sort((a, b) => b.count - a.count);

            // 4. Status Crítico (Temperaturas na Zona de Perigo < 24h)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentLogs = await TemperatureLog.find(); 
            
            const criticalUnitsMap = {};
            const criticalLogs = recentLogs.filter(log => {
                const logDate = log.data.measurementTime ? new Date(log.data.measurementTime) : new Date(log.data.createdAt);
                const isRecent = logDate > twentyFourHoursAgo;
                
                if (isRecent && !log.isCompliant) {
                    const uId = log.data.unitId;
                    const unit = units.find(u => u._id === uId);
                    if (unit) {
                        criticalUnitsMap[uId] = unit.data.name;
                    }
                    return true;
                }
                return false;
            });

            const criticalUnitsDetailed = Object.entries(criticalUnitsMap).map(([id, name]) => ({ id, name }));

            // 5. Saúde Ocupacional (RH)
            const employees = await Employee.find(filter);
            const totalEmployees = employees.length;
            const healthyEmployees = employees.filter(e => e.healthCompliance.tag === '#em_dia').length;
            const expiringSoonEmployees = employees.filter(e => e.healthCompliance.tag === '#atencao');
            const expiringSoonCount = expiringSoonEmployees.length;
            const healthComplianceRate = totalEmployees > 0 ? (healthyEmployees / totalEmployees) * 100 : 0;

            const healthUnitsInAlertMap = {};
            expiringSoonEmployees.forEach(e => {
                const uId = e.data.unitId || e.unitId;
                const unit = units.find(u => u._id === uId);
                if (unit) healthUnitsInAlertMap[uId] = unit.data.name;
            });
            const healthUnitsInAlert = Object.entries(healthUnitsInAlertMap).map(([id, name]) => ({ id, name }));

            // 6. Documentação das Unidades
            const activeUnitsDocs = (unitId && unitId !== 'all') ? units.filter(u => u._id === unitId) : units;
            let totalDocs = 0, expiredDocsCount = 0;
            const docUnitsInAlertMap = {};

            activeUnitsDocs.forEach(u => {
                const docsStatus = u.toJSON().documentationStatus;
                if (u.data.sanitaryDocs) totalDocs += u.data.sanitaryDocs.length;
                if (docsStatus.hasExpired) {
                    expiredDocsCount += docsStatus.expiredDocs.length;
                    docUnitsInAlertMap[u._id] = u.data.name;
                }
            });
            const docUnitsInAlert = Object.entries(docUnitsInAlertMap).map(([id, name]) => ({ id, name }));


            // 7. Inteligência Financeira (Estimativa de Perda por Desperdício)
            const COST_PER_KG = 16.50; // Valor médio estimado por kg de alimento pronto
            const estimatedLossValue = totalRestIngesta * COST_PER_KG;
            const wasteEfficiency = totalServed > 0 ? (100 - ((totalRestIngesta / (totalServed * 0.5)) * 100)) : 100;

            res.json({
                meals: {
                    served: totalServed,
                    contracted: totalContracted,
                    acceptability: totalContracted > 0 ? (totalServed / totalContracted) * 100 : 0
                },
                financial: {
                    estimatedLoss: estimatedLossValue.toFixed(2),
                    currency: 'R$',
                    wasteEfficiency: wasteEfficiency.toFixed(1),
                    potentialSavings: (estimatedLossValue * 0.3).toFixed(2) // 30% de redução possível
                },
                waste: {
                    totalKg: totalRestIngesta.toFixed(1),
                    percent: totalServed > 0 ? ((totalRestIngesta / (totalServed * 0.5)) * 100).toFixed(1) : 0,
                    byUnit: units.map(u => {
                        const unitMenus = menus.filter(m => m.unitId === u._id);
                        let prod = 0, rest = 0, sobra = 0;
                        unitMenus.forEach(m => {
                            m.data.meals?.forEach(meal => {
                                prod += (meal.stats?.producedQty || 0);
                                rest += (meal.stats?.restIngestaKg || 0);
                                sobra += (meal.stats?.leftoverKg || 0);
                            });
                        });
                        return { 
                            id: u._id,
                            name: u.data.name, 
                            produzido: prod, 
                            sobra, 
                            resto: rest,
                            lossValue: (rest * COST_PER_KG).toFixed(2)
                        };
                    }) // Removido filter para mostrar todas as unidades
                },
                radar: radarData,
                structural: structuralIssuesByUnit,
                totalUnits: units.length,
                critical: {
                    count: criticalLogs.length,
                    units: criticalUnitsDetailed
                },
                health: {
                    complianceRate: Math.round(healthComplianceRate),
                    expiringSoon: expiringSoonCount,
                    total: totalEmployees,
                    units: healthUnitsInAlert
                },
                docs: {
                    expired: expiredDocsCount,
                    complianceRate: radarData.documentacao,
                    units: docUnitsInAlert
                },
                heatmap,
                feeds: criticalLogs.slice(0, 5).map(log => {
                    const unit = units.find(u => u._id === log.data.unitId);
                    return {
                        id: log._id,
                        unitId: log.data.unitId,
                        unitName: unit ? unit.data.name : 'Unidade N/A',
                        title: `${unit ? unit.data.name : 'Alerta'}: ${log.data.equipment || 'Equipamento'}`,
                        msg: `${log.data.equipment || 'Item'} fora do padrão (${log.data.temperature}°C) na unidade ${unit ? unit.data.name : ''}.`,
                        date: new Date(log.data.measurementTime || log.data.createdAt).toLocaleTimeString('pt-BR'),
                        tag: '#critico'
                    };
                }),

                // Novo: Ações Corretivas Pendentes (RH/Inaptos)
                correctiveActions: employees.filter(e => e.healthCompliance.status === 'Inapto').map(e => ({
                    id: e._id,
                    employeeName: e.data.name,
                    role: e.data.role,
                    unitName: units.find(u => u._id === (e.data.unitId || e.unitId))?.data?.name || 'Unidade N/A',
                    unitId: e.data.unitId || e.unitId,
                    actions: {
                        training: e.data.correctiveActions?.training || false,
                        medicalExams: e.data.correctiveActions?.medicalExams || false,
                        others: e.data.correctiveActions?.others || ''
                    }
                })),

                // Brain Intelligence: Oportunidades
                opportunities: [
                    wasteEfficiency < 90 ? {
                        type: 'lucro',
                        title: 'Redução de Desperdício',
                        impact: `R$ ${(estimatedLossValue * 0.4).toFixed(2)}/mês`,
                        desc: 'Otimização de cardápio e porcionamento pode recuperar 40% das perdas atuais.'
                    } : null,
                    expiringSoonCount > 0 ? {
                        type: 'risco',
                        title: 'Conformidade de RH',
                        impact: 'Fiscalização',
                        desc: `${expiringSoonCount} colaboradores com exames vencendo. Evite multas trabalhistas.`
                    } : null
                ].filter(Boolean)
            });
        } catch (error) {
            console.error('[DASHBOARD ERROR]', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new DashboardController();
