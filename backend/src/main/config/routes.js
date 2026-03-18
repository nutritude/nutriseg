const express = require('express');

const MenuController = require('../../interfaces/controllers/MenuController');
const ChecklistController = require('../../interfaces/controllers/ChecklistController');
const UnitController = require('../../interfaces/controllers/UnitController');
const EmployeeController = require('../../interfaces/controllers/EmployeeController');
const TemperatureController = require('../../interfaces/controllers/TemperatureController');
const SampleController = require('../../interfaces/controllers/SampleController');
const DashboardController = require('../../interfaces/controllers/DashboardController');
const WasteController = require('../../interfaces/controllers/WasteController');
const FinancialController = require('../../interfaces/controllers/FinancialController');
const LogisticsController = require('../../interfaces/controllers/LogisticsController');
const RequestController = require('../../interfaces/controllers/RequestController');
const EventController = require('../../interfaces/controllers/EventController');
const ReportController = require('../../interfaces/controllers/ReportController');

module.exports = (app) => {
    app.get('/', (req, res) => {
        res.redirect('/api');
    });

    const router = express.Router();

    router.get('/', (req, res) => {
        res.send('🚀 Sistema de Gestão UAN - API Online e Segura');
    });

    // Health Check
    router.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date() });
    });

    // DEBUG Firebase - REMOVER APÓS DIAGNÓSTICO
    router.get('/debug-firebase', async (req, res) => {
        const path = require('path');
        const fs = require('fs');
        const keyPath = path.join(__dirname, '../../../infrastructure/database/firebase-key.json');
        res.json({
            hasBase64: !!process.env.FIREBASE_KEY_BASE64,
            base64Length: process.env.FIREBASE_KEY_BASE64 ? process.env.FIREBASE_KEY_BASE64.length : 0,
            hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
            projectId: process.env.FIREBASE_PROJECT_ID || 'N/A',
            hasEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            privateKeyStart: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.substring(0, 30) : 'N/A',
            fileExists: fs.existsSync(keyPath),
            filePath: keyPath,
        });
    });

    // === Módulo Logística e Rotas ===
    router.post('/logistics/plan', LogisticsController.planDay);
    router.patch('/logistics/plan/:id/start', LogisticsController.startRoute);
    router.patch('/logistics/plan/:id/unit/:unitId/checkin', LogisticsController.checkIn);
    router.patch('/logistics/plan/:id/finish', LogisticsController.finishDay);
    router.post('/logistics/tolls', LogisticsController.registerToll);
    router.get('/logistics/summary', LogisticsController.getWeeklySummary);

    // === Dashboard ===
    router.get('/dashboard/kpis', DashboardController.getKpis);

    // === Módulo Cardápio ===
    router.post('/menus', MenuController.create);
    router.get('/menus', MenuController.listByDate);
    router.patch('/menus/:id/meals/:mealId/stats', MenuController.updateMealStats);

    // === Módulo Checklist ===
    router.post('/checklists/templates', ChecklistController.createTemplate);
    router.get('/checklists/templates', ChecklistController.listTemplates);
    router.post('/checklists/submissions', ChecklistController.submit);
    router.get('/checklists/submissions', ChecklistController.listSubmissions);

    // === Módulo Unidades ===
    router.post('/units', UnitController.createUnit);
    router.get('/units', UnitController.getUnits);
    router.get('/units/expiring-docs', UnitController.getUnitsWithExpiringDocs);
    router.get('/units/:id', UnitController.getUnitById);
    router.put('/units/:id', UnitController.updateUnit);
    router.patch('/units/:id/deactivate', UnitController.deleteUnit);   // soft-delete
    router.delete('/units/:id', UnitController.hardDeleteUnit);          // hard-delete

    // === Módulo Equipe ===
    router.post('/employees', EmployeeController.createEmployee);
    router.get('/employees', EmployeeController.getAllEmployees);
    router.get('/employees/health-issues', EmployeeController.getEmployeesWithHealthIssues);
    router.get('/employees/unit/:unitId', EmployeeController.getEmployeesByUnit);
    router.get('/employees/:id', EmployeeController.getEmployeeById);
    router.put('/employees/:id', EmployeeController.updateEmployee);
    router.patch('/employees/:id/deactivate', EmployeeController.deleteEmployee);   // soft-delete
    router.patch('/employees/:id/reactivate', EmployeeController.reactivateEmployee); // reactivation
    router.delete('/employees/:id', EmployeeController.hardDeleteEmployee);          // hard-delete

    // === Módulo Termometria ===
    router.post('/temperatures', TemperatureController.createLog);
    router.get('/temperatures', TemperatureController.getLogs);
    router.get('/temperatures/unit/:unitId', TemperatureController.getLogsByUnit);
    router.get('/temperatures/non-compliant', TemperatureController.getNonCompliantLogs);
    router.get('/temperatures/report', TemperatureController.generateReport);
    router.put('/temperatures/:id', TemperatureController.updateLog);
    router.delete('/temperatures/:id', TemperatureController.deleteLog);

    // === Módulo Amostras ===
    router.post('/samples', SampleController.createSample);
    router.get('/samples', SampleController.getSamples);
    router.get('/samples/menu/:menuId', SampleController.getSamplesByMenu);
    router.get('/samples/expiring', SampleController.getExpiringSamples);
    router.post('/samples/generate-labels', SampleController.generateLabels);
    router.put('/samples/:id', SampleController.updateSample);
    router.delete('/samples/:id', SampleController.deleteSample);

    // === Módulo Desperdício ===
    router.post('/waste', WasteController.create);
    router.get('/waste/unit/:unitId', WasteController.getByUnit);
    router.get('/waste/stats', WasteController.getGlobalStats);

    // === Módulo Financeiro ===
    router.post('/financial', FinancialController.create);
    router.get('/financial/unit/:unitId', FinancialController.getByUnit);
    router.get('/financial/summary', FinancialController.getReimbursementSummary);

    // === Módulo Solicitações ===
    router.get('/requests', RequestController.getAll);
    router.post('/requests', RequestController.create);
    router.patch('/requests/:id/status', RequestController.updateStatus);

    // === Módulo Agenda de Eventos ===
    router.get('/events', EventController.getAll);
    router.post('/events', EventController.create);
    router.put('/events/:id', EventController.update);
    router.delete('/events/:id', EventController.delete);
    router.get('/events/materials/availability', EventController.getMaterialsAvailability);
    router.patch('/events/:id/checklist', EventController.updateChecklist);
    router.get('/events/stats/bi', EventController.getReportBI);

    // === Módulo de Relatórios ===
    router.get('/reports/non-conformities', ReportController.getNonConformities);
    router.get('/reports/requests', ReportController.getRequests);
    router.get('/reports/waste', ReportController.getWasteReport);
    router.get('/reports/employees', ReportController.getEmployeesReport);
    router.get('/reports/performance', ReportController.getPerformanceReport);
    router.get('/reports/temperatures', ReportController.getTemperaturesReport);
    router.get('/reports/visits', ReportController.getVisitsReport);
    router.get('/reports/trainings', ReportController.getTrainingsReport);

    app.use('/api', router);
};

