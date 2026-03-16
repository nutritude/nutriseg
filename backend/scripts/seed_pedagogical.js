const Unit = require('../src/infrastructure/database/models/Unit');
const Employee = require('../src/infrastructure/database/models/Employee');
const Menu = require('../src/infrastructure/database/models/Menu');
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

const menuScenarios = [
    {
        type: 'Padrão Profissional',
        meals: [
            {
                type: 'Almoço',
                items: [
                    { name: 'Arroz Integral com Linhaça', category: 'Base' },
                    { name: 'Feijão Preto com Louro', category: 'Base' },
                    { name: 'Lagarto ao Molho Madeira', category: 'Principal' },
                    { name: 'Omelete de Ervas (Opção)', category: 'Opção' },
                    { name: 'Ratatouille de Legumes', category: 'Guarnição' },
                    { name: 'Salada de Folhas Nobres', category: 'Salada' },
                    { name: 'Salada de Grão de Bico', category: 'Salada' },
                    { name: 'Pudim de Leite Condensado', category: 'Sobremesa' }
                ]
            }
        ]
    },
    {
        type: 'Regional/Brasileiro',
        meals: [
            {
                type: 'Almoço',
                items: [
                    { name: 'Arroz Branco Soltinho', category: 'Base' },
                    { name: 'Feijão Carioca Prime', category: 'Base' },
                    { name: 'Feijoada Completa', category: 'Principal' },
                    { name: 'Couve Refogada com Bacon', category: 'Guarnição' },
                    { name: 'Farofa de Ovos', category: 'Acompanhamento' },
                    { name: 'Laranja em Rodelas', category: 'Salada' },
                    { name: 'Mix de Folhas Verdes', category: 'Salada' },
                    { name: 'Doce de Abóbora Caseiro', category: 'Sobremesa' }
                ]
            }
        ]
    },
    {
        type: 'Light/Fitness',
        meals: [
            {
                type: 'Almoço',
                items: [
                    { name: 'Arroz 7 Grãos', category: 'Base' },
                    { name: 'Caldo de Lentilha', category: 'Base' },
                    { name: 'Filé de Tilápia Grelhada', category: 'Principal' },
                    { name: 'Sobrecoxa Assada sem Pele', category: 'Opção' },
                    { name: 'Purê de Mandioquinha', category: 'Guarnição' },
                    { name: 'Salada de Brócolis e Cenoura', category: 'Salada' },
                    { name: 'Alface e Tomate Cereja', category: 'Salada' },
                    { name: 'Fruta da Estação', category: 'Sobremesa' }
                ]
            }
        ]
    },
    {
        type: 'Italiano',
        meals: [
            {
                type: 'Almoço',
                items: [
                    { name: 'Arroz com Parmesão', category: 'Base' },
                    { name: 'Lasanha à Bolonhesa', category: 'Principal' },
                    { name: 'Frango Grelhado ao Pesto', category: 'Opção' },
                    { name: 'Polenta Cremosa', category: 'Guarnição' },
                    { name: 'Salada Caprese', category: 'Salada' },
                    { name: 'Rúcula com Tomate Seco', category: 'Salada' },
                    { name: 'Gelatina de Morango', category: 'Sobremesa' }
                ]
            }
        ]
    },
    {
        type: 'Especial Árabe',
        meals: [
            {
                type: 'Almoço',
                items: [
                    { name: 'Arroz com Lentilha e Cebola Crisp', category: 'Base' },
                    { name: 'Quibe Assado Recheado', category: 'Principal' },
                    { name: 'Kafta de Carne na Brasa', category: 'Opção' },
                    { name: 'Hummus (Pasta de Grão de Bico)', category: 'Guarnição' },
                    { name: 'Tabule Tradicional', category: 'Salada' },
                    { name: 'Babaganoush', category: 'Salada' },
                    { name: 'Arroz Doce com Canela', category: 'Sobremesa' }
                ]
            }
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
        console.log('🚀 Iniciando Seeding Pedagógico para Testes e Treinamento...');

        await Unit.deleteMany('units', {});
        await Employee.deleteMany('employees', {});
        await Menu.deleteMany('menus', {});
        await ChecklistSubmission.deleteMany('checklist_submissions', {});
        await TemperatureLog.deleteMany('temperature_logs', {});
        console.log('🗑️ Banco de dados limpo.');

        for (let i = 0; i < unitsData.length; i++) {
            const uData = unitsData[i];
            const unit = new Unit(uData);
            await unit.save();
            console.log(`🏢 Unidade Criada: ${unit.data.name}`);

            for (let j = 0; j < 5; j++) {
                const scenario = employeeScenarios[j];
                let examDate;
                const now = new Date();

                if (scenario.health === 'OK') {
                    examDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                } else if (scenario.health === 'Expiring') {
                    examDate = new Date(now.getTime() - 355 * 24 * 60 * 60 * 1000);
                } else {
                    examDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000);
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
            console.log(`  👥 5 Funcionários vinculados.`);

            const dates = [
                new Date(Date.now() - 24 * 60 * 60 * 1000),
                new Date(),
                new Date(Date.now() + 24 * 60 * 60 * 1000)
            ];

            const scenario = menuScenarios[i % menuScenarios.length];

            for (const date of dates) {
                const menu = new Menu({
                    unitId: unit._id,
                    date: date.toISOString().split('T')[0],
                    status: date < new Date() ? '#concluido' : '#planejado',
                    meals: scenario.meals.map(m => ({
                        ...m,
                        stats: {
                            contractedQty: unit.data.mealTargets?.lunch || 500,
                            servedQty: Math.floor((unit.data.mealTargets?.lunch || 500) * (0.85 + Math.random() * 0.15)),
                            restIngestaKg: parseFloat((2 + Math.random() * 15).toFixed(1))
                        }
                    }))
                });
                await menu.save();
            }
            console.log(`  🍽️ 3 Cardápios (${scenario.type}) gerados.`);

            const equipments = [
                { name: 'Balcão Térmico Principal', cat: 'Quente', ideal: 65, status: 'OK' },
                { name: 'Câmara Fria Laticínios', cat: 'Frio', ideal: 3, status: 'Critico' },
                { name: 'Pass-through Alface', cat: 'Frio', ideal: 8, status: 'OK' },
                { name: 'Caldeirão Industrial', cat: 'Cozimento', ideal: 85, status: 'Alerta' }
            ];

            for (const eq of equipments) {
                let tempValue = eq.ideal;
                let tag = '#conforme';

                if (eq.status === 'Critico') {
                    tempValue = eq.cat === 'Quente' ? 45 : 12; // Perigo
                    tag = '#critico';
                } else if (eq.status === 'Alerta') {
                    tempValue = eq.cat === 'Quente' ? 58 : 9; // Próximo ao limite
                    tag = '#alerta';
                }

                const tempLog = new TemperatureLog({
                    unitId: unit._id,
                    equipment: eq.name,
                    category: eq.cat,
                    temperature: tempValue,
                    unit: '°C',
                    measurementTime: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000),
                    tag: tag
                });
                await tempLog.save();
            }
            console.log(`  🌡️ 4 Verificações de Temperatura registradas para treinamento.`);
        }

        console.log('\n✨ População Pedagógica Concluída! Pronto para Treinamentos de Auditoria.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro no Seeding:', error);
        process.exit(1);
    }
};

seed();
