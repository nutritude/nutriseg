const Menu = require('../../infrastructure/database/models/Menu');
const Unit = require('../../infrastructure/database/models/Unit');

class MenuController {
    create = async (req, res) => {
        try {
            const { unit: unitId, meals } = req.body;
            if (!unitId) return res.status(400).json({ error: 'Unidade é obrigatória.' });

            const unit = await Unit.findById(unitId);
            if (!unit) return res.status(404).json({ error: 'Unidade não encontrada.' });

            const menu = new Menu(req.body);
            await menu.save();
            res.status(201).json(menu);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    listByDate = async (req, res) => {
        try {
            const { date, unitId } = req.query;
            let query = {};
            // Simplificação para Firestore (filtros exatos)
            if (date) query.date = date;
            if (unitId) query.unitId = unitId;

            const menus = await Menu.find(query);
            // Manual populate para a unidade se necessário
            for (let m of menus) {
                if (m.data.unitId) {
                    m.unit = await Unit.findById(m.data.unitId);
                }
            }
            res.json(menus);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    updateMealStats = async (req, res) => {
        try {
            const { id, mealId } = req.params;
            const { stats, dishes } = req.body;

            const menu = await Menu.findById(id);
            if (!menu) return res.status(404).json({ error: 'Cardápio não encontrado.' });

            // Firestore objects não têm .id(), fazemos busca manual
            const meal = menu.data.meals.find(m => (m._id || m.id) === mealId);
            if (!meal) return res.status(404).json({ error: 'Refeição não encontrada.' });

            if (stats) meal.stats = { ...meal.stats, ...stats };

            if (dishes && Array.isArray(dishes)) {
                dishes.forEach(dishUpdate => {
                    const dish = meal.dishes.find(d => (d._id || d.id) === dishUpdate._id);
                    if (dish) {
                        dish.operational = { ...dish.operational, ...dishUpdate.operational };
                        dish.safety = { ...dish.safety, ...dishUpdate.safety };
                    }
                });
            }

            // AI Logic...
            const globalWasteKg = (Number(meal.stats?.restIngestaKg) || 0);
            const servedCount = Number(meal.stats?.servedQty) || 1;
            const perCapitaWaste = globalWasteKg / servedCount;

            meal.aiAnalysis = {
                content: perCapitaWaste > 0.050 ? "🚨 Desperdício Crítico" : "✅ Eficiência Alta",
                generatedAt: new Date(),
                status: "Completed"
            };

            await menu.save();
            res.json(menu);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new MenuController();
