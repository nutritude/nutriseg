const Request = require('../../infrastructure/database/models/Request');
const Unit = require('../../infrastructure/database/models/Unit');
const Employee = require('../../infrastructure/database/models/Employee');

class RequestController {
    getAll = async (req, res) => {
        try {
            const { unitId } = req.query;
            const filter = unitId ? { unitId } : {};
            const requests = await Request.find(filter);
            
            // Popular unidades e funcionários se necessário
            const units = await Unit.find();
            const employees = await Employee.find();

            const populated = requests.map(r => {
                const doc = r.toJSON();
                doc.unit = units.find(u => u._id === doc.unitId);
                // Se for pedido de RH, popular funcionário
                if (doc.type === 'RH' && doc.employeeId) {
                    doc.employee = employees.find(e => e._id === doc.employeeId);
                }
                return doc;
            });

            res.json(populated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    create = async (req, res) => {
        try {
            const newRequest = new Request(req.body);
            const saved = await newRequest.save();
            
            // Se for pedido de RH, podemos atualizar o status do funcionário se solicitado
            if (req.body.type === 'RH' && req.body.employeeId && req.body.updateEmployeeStatus) {
                await Employee.findByIdAndUpdate(req.body.employeeId, {
                    status: req.body.newStatus || 'Ativo'
                });
            }

            res.status(201).json(saved);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updated = await Request.findByIdAndUpdate(id, { status });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new RequestController();
