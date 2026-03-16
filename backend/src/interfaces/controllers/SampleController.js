const Sample = require('../../infrastructure/database/models/Sample');

class SampleController {
    // Create new sample
    async createSample(req, res) {
        try {
            const sampleData = req.body;
            const sample = new Sample(sampleData);
            await sample.save();

            res.status(201).json({
                message: 'Amostra registrada com sucesso',
                sample
            });
        } catch (error) {
            console.error('[CREATE SAMPLE ERROR]', error);
            res.status(400).json({
                error: error.message || 'Erro ao registrar amostra'
            });
        }
    }

    // Get all samples with filters
    async getSamples(req, res) {
        try {
            const { unitId, menuId, date, shift, status } = req.query;
            const filter = {};

            if (unitId) filter.unitId = unitId;
            if (menuId) filter.menuId = menuId;
            if (shift) filter.shift = shift;
            if (status) filter.status = status;

            if (date) {
                const startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
                filter.date = { $gte: startDate, $lte: endDate };
            }

            const samples = await Sample.find(filter);

            // Manual sort
            samples.sort((a, b) => new Date(b.data.collectionTime || 0) - new Date(a.data.collectionTime || 0));

            // Manual populate (Unidade)
            const Unit = require('../../infrastructure/database/models/Unit');
            for (let sample of samples) {
                if (sample.data.unitId) {
                    sample.unitId = await Unit.findById(sample.data.unitId);
                }
            }

            res.json({
                count: samples.length,
                samples
            });
        } catch (error) {
            console.error('[GET SAMPLES ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar amostras' });
        }
    }

    // Get samples by menu
    async getSamplesByMenu(req, res) {
        try {
            const { menuId } = req.params;

            const samples = await Sample.find({ menuId });

            // Manual sort & populate
            samples.sort((a, b) => new Date(b.data.collectionTime || 0) - new Date(a.data.collectionTime || 0));
            const Unit = require('../../infrastructure/database/models/Unit');
            for (let sample of samples) {
                if (sample.data.unitId) sample.unitId = await Unit.findById(sample.data.unitId);
            }

            res.json({
                count: samples.length,
                samples
            });
        } catch (error) {
            console.error('[GET SAMPLES BY MENU ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar amostras do cardápio' });
        }
    }

    // Get expiring samples (< 24h remaining)
    async getExpiringSamples(req, res) {
        try {
            const { unitId } = req.query;
            const filter = { status: 'Coletada' };

            if (unitId) filter.unitId = unitId;

            let samples = await Sample.find(filter)
                .populate('unitId', 'name')
                .sort({ collectionTime: 1 });

            // Filter expiring soon or expired
            samples = samples.filter(sample =>
                sample.isExpiringSoon || sample.isExpired
            );

            res.json({
                count: samples.length,
                samples
            });
        } catch (error) {
            console.error('[GET EXPIRING SAMPLES ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar amostras vencendo' });
        }
    }

    // Generate sample labels (returns data for frontend PDF generation)
    async generateLabels(req, res) {
        try {
            const { sampleIds } = req.body;

            if (!sampleIds || sampleIds.length === 0) {
                return res.status(400).json({ error: 'Nenhuma amostra selecionada' });
            }

            const samples = [];
            for (const id of sampleIds) {
                const s = await Sample.findById(id);
                if (s) samples.push(s);
            }

            if (samples.length === 0) {
                return res.status(404).json({ error: 'Amostras não encontradas' });
            }

            // Return label data for frontend to generate PDF
            const labels = samples.map(sample => ({
                unitName: sample.unitId?.name || 'N/A',
                date: new Date(sample.date).toLocaleDateString('pt-BR'),
                shift: sample.shift,
                dishName: sample.dishName,
                collectionTime: new Date(sample.collectionTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                collectedBy: sample.collectedBy,
                expirationDate: new Date(sample.expirationDate).toLocaleString('pt-BR')
            }));

            res.json({
                count: labels.length,
                labels
            });

        } catch (error) {
            console.error('[GENERATE LABELS ERROR]', error);
            res.status(500).json({ error: 'Erro ao gerar etiquetas' });
        }
    }

    // Update sample
    updateSample = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const sample = await Sample.findByIdAndUpdate(id, updateData);

            if (!sample) {
                return res.status(404).json({ error: 'Amostra não encontrada' });
            }

            res.json({
                message: 'Amostra atualizada com sucesso',
                sample
            });
        } catch (error) {
            console.error('[UPDATE SAMPLE ERROR]', error);
            res.status(400).json({ error: error.message || 'Erro ao atualizar amostra' });
        }
    }

    // Delete sample
    deleteSample = async (req, res) => {
        try {
            const { id } = req.params;

            const sample = await Sample.findByIdAndDelete(id);

            if (!sample) {
                return res.status(404).json({ error: 'Amostra não encontrada' });
            }

            res.json({
                message: 'Amostra deletada com sucesso'
            });
        } catch (error) {
            console.error('[DELETE SAMPLE ERROR]', error);
            res.status(500).json({ error: 'Erro ao deletar amostra' });
        }
    }
}

module.exports = new SampleController();
