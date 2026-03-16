const { ChecklistTemplate, ChecklistSubmission } = require('../../infrastructure/database/models/Checklist');

class ChecklistController {
    // === Templates ===
    createTemplate = async (req, res) => {
        try {
            const template = new ChecklistTemplate(req.body);
            await template.save();
            res.status(201).json(template);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    listTemplates = async (req, res) => {
        try {
            const templates = await ChecklistTemplate.find({ active: true });
            res.json(templates);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // === Submissions ===
    submit = async (req, res) => {
        try {
            // Aqui futuramente calcularemos o score antes de salvar
            const submission = new ChecklistSubmission(req.body);
            await submission.save();
            res.status(201).json(submission);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    listSubmissions = async (req, res) => {
        try {
            const submissions = await ChecklistSubmission.find();

            // Manual sort
            submissions.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0));

            // Manual populate (Template)
            for (let s of submissions) {
                if (s.data.templateId) {
                    s.template = await ChecklistTemplate.findById(s.data.templateId);
                }
            }
            res.json(submissions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ChecklistController();
