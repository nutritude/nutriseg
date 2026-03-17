const Unit = require('../../infrastructure/database/models/Unit');

class UnitController {
    // Create new unit
    createUnit = async (req, res) => {
        try {
            const unitData = req.body;
            const unit = new Unit(unitData);
            await unit.save();

            res.status(201).json({
                message: 'Unidade criada com sucesso',
                unit
            });
        } catch (error) {
            console.error('[CREATE UNIT ERROR]', error);
            res.status(400).json({
                error: error.message || 'Erro ao criar unidade'
            });
        }
    }

    // Get all units
    getUnits = async (req, res) => {
        try {
            const { active } = req.query;
            const filter = active !== undefined ? { active: active === 'true' } : {};

            const units = (await Unit.find(filter)).sort((a, b) => a.data.name?.localeCompare(b.data.name));

            res.json({
                count: units.length,
                units
            });
        } catch (error) {
            console.error('[GET UNITS ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar unidades', details: error.message, stack: error.stack });
        }
    }

    // Get unit by ID
    getUnitById = async (req, res) => {
        try {
            const { id } = req.params;
            const unit = await Unit.findById(id);

            if (!unit) {
                return res.status(404).json({ error: 'Unidade não encontrada' });
            }

            res.json(unit);
        } catch (error) {
            console.error('[GET UNIT BY ID ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar unidade' });
        }
    }

    // Update unit
    updateUnit = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const unit = await Unit.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!unit) {
                return res.status(404).json({ error: 'Unidade não encontrada' });
            }

            res.json({
                message: 'Unidade atualizada com sucesso',
                unit
            });
        } catch (error) {
            console.error('[UPDATE UNIT ERROR]', error);
            res.status(400).json({ error: error.message || 'Erro ao atualizar unidade' });
        }
    }

    // Deactivate unit (soft delete - keeps record, sets active=false)
    deleteUnit = async (req, res) => {
        try {
            const { id } = req.params;

            const unit = await Unit.findByIdAndUpdate(
                id,
                { active: false, updatedAt: new Date() },
                { new: true }
            );

            if (!unit) {
                return res.status(404).json({ error: 'Unidade não encontrada' });
            }

            res.json({
                message: 'Unidade desativada com sucesso',
                unit
            });
        } catch (error) {
            console.error('[DELETE UNIT ERROR]', error);
            res.status(500).json({ error: 'Erro ao desativar unidade' });
        }
    }

    // Hard delete unit (permanent - removes from DB)
    hardDeleteUnit = async (req, res) => {
        try {
            const { id } = req.params;

            const unit = await Unit.findByIdAndDelete(id);

            if (!unit) {
                return res.status(404).json({ error: 'Unidade não encontrada' });
            }

            res.json({
                message: 'Unidade excluída permanentemente',
                deletedId: id
            });
        } catch (error) {
            console.error('[HARD DELETE UNIT ERROR]', error);
            res.status(500).json({ error: 'Erro ao excluir unidade' });
        }
    }

    // Get units with expiring documents
    getUnitsWithExpiringDocs = async (req, res) => {
        try {
            const units = await Unit.find({ active: true });

            const unitsWithExpiringDocs = units.filter(unit =>
                unit.docsExpiringWithin30Days.length > 0 || unit.hasExpiredDocs
            );

            res.json({
                count: unitsWithExpiringDocs.length,
                units: unitsWithExpiringDocs
            });
        } catch (error) {
            console.error('[GET EXPIRING DOCS ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar documentos vencendo' });
        }
    }
}

module.exports = new UnitController();
