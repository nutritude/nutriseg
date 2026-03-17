const Event = require('../../infrastructure/database/models/Event');
const DecorationItem = require('../../infrastructure/database/models/DecorationItem');
const Unit = require('../../infrastructure/database/models/Unit');

class EventController {
    getAll = async (req, res) => {
        try {
            const { unitId, startDate, endDate } = req.query;
            let filter = {};
            if (unitId) filter.unitId = unitId;
            
            const events = await Event.find(filter);
            
            // Filtro de data se fornecido
            let filtered = events;
            if (startDate && endDate) {
                filtered = events.filter(e => {
                    const d = new Date(e.data.date);
                    return d >= new Date(startDate) && d <= new Date(endDate);
                });
            }

            res.json(filtered.map(e => e.toJSON()));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    getMaterialsAvailability = async (req, res) => {
        try {
            const { date } = req.query;
            if (!date) return res.status(400).json({ error: 'Data é obrigatória' });

            const allItems = await DecorationItem.find();
            const eventsOnDate = await Event.find({ date: date }); // Simplificado: assumindo string YYYY-MM-DD

            const itemsWithStatus = allItems.map(item => {
                const doc = item.toJSON();
                const reserved = eventsOnDate.some(ev => 
                    ev.data.checklist_materials && 
                    ev.data.checklist_materials.some(m => m.item_id === doc._id)
                );
                return {
                    ...doc,
                    available: !reserved
                };
            });

            res.json(itemsWithStatus);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    create = async (req, res) => {
        try {
            const { date } = req.body;
            const today = new Date().toISOString().split('T')[0];
            
            if (date < today) {
                return res.status(400).json({ error: 'Não é permitido agendar eventos em datas retroativas.' });
            }

            const newEvent = new Event(req.body);
            const saved = await newEvent.save();
            res.status(201).json(saved);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const { date } = req.body;
            const today = new Date().toISOString().split('T')[0];

            if (date && date < today) {
                return res.status(400).json({ error: 'Não é permitido alterar o evento para uma data retroativa.' });
            }

            const updated = await Event.findByIdAndUpdate(id, req.body);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    delete = async (req, res) => {
        try {
            const { id } = req.params;
            await Event.findByIdAndDelete(id);
            res.json({ message: 'Evento excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    updateChecklist = async (req, res) => {
        try {
            const { id } = req.params;
            const { checklist_materials, checkin_photos } = req.body;
            
            const updated = await Event.findByIdAndUpdate(id, { 
                checklist_materials,
                checkin_photos,
                status: req.body.status || 'Agendado'
            });
            
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    getReportBI = async (req, res) => {
        try {
            const events = await Event.find();
            // Lógica simples de BI para protótipo
            const stats = {
                totalEvents: events.length,
                mostUsedMaterials: {},
                avgAcceptability: 85 // Mocked for now
            };
            
            events.forEach(ev => {
                if (ev.data.checklist_materials) {
                    ev.data.checklist_materials.forEach(m => {
                        stats.mostUsedMaterials[m.item_id] = (stats.mostUsedMaterials[m.item_id] || 0) + 1;
                    });
                }
            });

            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new EventController();
