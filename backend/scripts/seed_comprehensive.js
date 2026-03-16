const Unit = require('../src/infrastructure/database/models/Unit');
const Employee = require('../src/infrastructure/database/models/Employee');
const Menu = require('../src/infrastructure/database/models/Menu');
const RoutePlan = require('../src/infrastructure/database/models/RoutePlan');
const FinancialLog = require('../src/infrastructure/database/models/FinancialLog');
const { ChecklistSubmission } = require('../src/infrastructure/database/models/Checklist');
const TemperatureLog = require('../src/infrastructure/database/models/TemperatureLog');
require('dotenv').config();

const unitsData = [
    {
        name: 'Sumaré - Planta Metalurgica',
        cnpj: '11.111.111/0001-01',
        type: 'Local',
        location: { lat: -23.518, lng: -46.686 },
        mealTargets: { breakfast: 150, lunch: 450, dinner: 120, supper: 50 },
        sanitaryDocs: [
            { type: 'Alvará Sanitário', expirationDate: new Date('2024-01-01'), status: 'Vencido' },
            { type: 'PGR', expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: 'Vencendo' }
        ]
    },
    {
        name: 'Campinas - Tech Center',
        cnpj: '22.222.222/0002-02',
        type: 'Local',
        location: { lat: -22.906, lng: -47.061 },
        mealTargets: { breakfast: 100, lunch: 800, dinner: 200, supper: 0 },
        sanitaryDocs: [
            { type: 'Alvará Sanitário', expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), status: 'OK' }
        ]
    },
    {
        name: 'Hortolândia - CD Logística',
        cnpj: '33.333.333/0003-03',
        type: 'Transportada',
        location: { lat: -22.863, lng: -47.216 },
        mealTargets: { breakfast: 50, lunch: 300, dinner: 50, supper: 20 },
        sanitaryDocs: []
    },
    {
        name: 'Valinhos - Pharma Lab',
        cnpj: '44.444.444/0004-04',
        type: 'Local',
        location: { lat: -22.969, lng: -47.014 },
        mealTargets: { breakfast: 200, lunch: 500, dinner: 0, supper: 0 },
        sanitaryDocs: [
            { type: 'Alvará Sanitário', expirationDate: new Date('2023-12-15'), status: 'Critico' }
        ]
    },
    {
        name: 'Paulínia - Refinaria Polo',
        cnpj: '55.555.555/0005-05',
        type: 'Local',
        location: { lat: -22.763, lng: -47.151 },
        mealTargets: { breakfast: 300, lunch: 1200, dinner: 400, supper: 100 },
        sanitaryDocs: [
            { type: 'Dedetização', expirationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'Vencido' }
        ]
    }
];

const employeeScenarios = [
    { name: 'João Silva', role: 'Cozinheiro Líder', type: 'CLT', status: '#ativo', health: 'OK' },
    { name: 'Maria Santos', role: 'Auxiliar de Cozinha', type: 'CLT', status: '#ferias', health: 'Expiring' },
    { name: 'Pedro Souza', role: 'Meio Oficial', type: 'Freelancer', status: '#folga', health: 'Expired' },
    { name: 'Ana Oliveira', role: 'Nutricionista Jr', type: 'CLT', status: '#afastado', health: 'OK' },
    { name: 'Carlos Lima', role: 'Açougueiro', type: 'Freelancer', status: '#ativo', health: 'OK' }
];

const seed = async () => {
    try {
        console.log('🚀 Iniciando Seeding Completo para Testes...');

        // Limpar coleções
        await Unit.deleteMany('units', {});
        await Employee.deleteMany('employees', {});
        await Menu.deleteMany('menus', {});
        await ChecklistSubmission.deleteMany('checklist_submissions', {});
        await TemperatureLog.deleteMany('temperature_logs', {});
        console.log('🗑️ Banco de dados limpo.');

        for (const uData of unitsData) {
            const unit = new Unit(uData);
            await unit.save();
            console.log(`🏢 Unidade Criada: ${unit.data.name}`);

            // 5 Funcionários para esta Unidade
            for (let i = 0; i < 5; i++) {
                const scenario = employeeScenarios[i];
                let examDate;
                const now = new Date();

                if (scenario.health === 'OK') {
                    examDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 1 mes atrás
                } else if (scenario.health === 'Expiring') {
                    examDate = new Date(now.getTime() - 355 * 24 * 60 * 60 * 1000); // Vence em 10 dias (considerando 365 dias)
                } else {
                    examDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000); // Já venceu
                }

                const employee = new Employee({
                    unitId: unit._id,
                    name: `${scenario.name} (${unit.data.name.split(' ')[0]})`,
                    role: scenario.role,
                    employmentType: scenario.type,
                    status: scenario.status,
                    active: true,
                    hasFoodContact: true,
                    health: {
                        lastASO: examDate,
                        hygieneTrainingDate: examDate,
                        coprocultureDate: examDate
                    }
                });
                await employee.save();
            }
            console.log(`  👥 5 Funcionários vinculados à ${unit.data.name}`);

            // 3 Cardápios para esta Unidade (Ontem, Hoje, Amanhã)
            const dates = [
                new Date(Date.now() - 24 * 60 * 60 * 1000),
                new Date(),
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            ];

            for (const date of dates) {
                const menu = new Menu({
                    unitId: unit._id,
                    date: date.toISOString().split('T')[0],
                    status: date < new Date() ? '#concluido' : '#planejado',
                    meals: [
                        {
                            type: 'Almoço',
                            items: [
                                { name: 'Arroz Branco', category: 'Base' },
                                { name: 'Feijão Carioca', category: 'Base' },
                                { name: 'Frango Assado', category: 'Principal' },
                                { name: 'Seleta de Legumes', category: 'Guarnição' },
                                { name: 'Salada de Alface', category: 'Salada' }
                            ],
                            stats: {
                                contractedQty: unit.data.mealTargets?.lunch || 500,
                                servedQty: Math.floor((unit.data.mealTargets?.lunch || 500) * (0.85 + Math.random() * 0.15)),
                                restIngestaKg: parseFloat((5 + Math.random() * 20).toFixed(1))
                            }
                        }
                    ]
                });
                await menu.save();
            }
            console.log(`  🍽️ 3 Cardápios gerados para ${unit.data.name}`);

            // Algumas Temperaturas Críticas para o Dashboard (Fictícias)
            const tempLog = new TemperatureLog({
                unitId: unit._id,
                equipment: 'Balcão Térmico Principal',
                category: 'Quente',
                temperature: 52, // Abaixo dos 60°C (Crítico)
                unit: '°C',
                measurementTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
                tag: '#critico'
            });
            await tempLog.save();
        }

        console.log('\n✨ População de Testes Concluída com Sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no Seeding:', error);
        process.exit(1);
    }
};

seed();
