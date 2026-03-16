/**
 * Script de Seed via API HTTP
 * Popula o banco de dados rodando em localhost:3000 via requisições HTTP
 * Uso: node seed_api.js
 */
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const UNITS_DATA = [
    {
        name: 'UAN Central - Hospital São Lucas',
        cnpj: '12.345.678/0001-90',
        type: 'Local',
        rtNutritionist: 'Dra. Ana Paula Ferreira',
        address: {
            street: 'Av. Paulista',
            number: '1500',
            complement: 'Bloco B, Subsolo',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100'
        },
        mealTargets: { breakfast: 120, lunch: 350, dinner: 280, supper: 90 },
        menuComponents: { principal: 2, guarnicao: 2, salada: 3, sobremesa: 2, suco: 1 },
        fixedDishes: [
            { name: 'Arroz Branco', category: 'Principal' },
            { name: 'Feijão Carioca', category: 'Principal' },
            { name: 'Suco de Laranja', category: 'Suco' }
        ],
        sanitaryDocs: [
            { type: 'Alvará', filePath: 'alvara_2025.pdf', expirationDate: '2026-12-31' },
            { type: 'PGR', filePath: 'pgr_2025.pdf', expirationDate: '2026-06-30' },
            { type: 'Contrato', filePath: 'contrato_2025.pdf', expirationDate: '2027-01-15' }
        ],
        active: true
    },
    {
        name: 'UAN Refeitório - Empresa TechCorp',
        cnpj: '23.456.789/0001-01',
        type: 'Local',
        rtNutritionist: 'Dr. Carlos Eduardo Mendes',
        address: {
            street: 'Rua das Flores',
            number: '250',
            complement: 'Térreo',
            neighborhood: 'Jardim América',
            city: 'Campinas',
            state: 'SP',
            zipCode: '13010-050'
        },
        mealTargets: { breakfast: 80, lunch: 420, dinner: 0, supper: 0 },
        menuComponents: { principal: 2, guarnicao: 1, salada: 2, sobremesa: 1, suco: 1 },
        fixedDishes: [
            { name: 'Arroz Integral', category: 'Principal' },
            { name: 'Feijão Preto', category: 'Principal' }
        ],
        sanitaryDocs: [
            { type: 'Alvará', filePath: 'alvara_techcorp.pdf', expirationDate: '2026-08-15' },
            { type: 'Contrato', filePath: 'contrato_techcorp.pdf', expirationDate: '2026-12-31' }
        ],
        active: true
    },
    {
        name: 'UAN Escola Municipal João XXIII',
        cnpj: '34.567.890/0001-12',
        type: 'Local',
        rtNutritionist: 'Dra. Mariana Costa Silva',
        address: {
            street: 'Rua Professor Antônio',
            number: '88',
            complement: '',
            neighborhood: 'Centro',
            city: 'Ribeirão Preto',
            state: 'SP',
            zipCode: '14010-020'
        },
        mealTargets: { breakfast: 200, lunch: 450, dinner: 0, supper: 0 },
        menuComponents: { principal: 1, guarnicao: 1, salada: 2, sobremesa: 1, suco: 1 },
        fixedDishes: [
            { name: 'Arroz Branco', category: 'Principal' },
            { name: 'Feijão Carioca', category: 'Principal' },
            { name: 'Fruta da Estação', category: 'Sobremesa' }
        ],
        sanitaryDocs: [
            { type: 'Alvará', filePath: 'alvara_escola.pdf', expirationDate: '2026-03-31' },
            { type: 'PGR', filePath: 'pgr_escola.pdf', expirationDate: '2026-09-30' }
        ],
        active: true
    },
    {
        name: 'UAN Transportada - Canteiro de Obras Norte',
        cnpj: '45.678.901/0001-23',
        type: 'Transportada',
        rtNutritionist: 'Dr. Roberto Alves Neto',
        address: {
            street: 'Rodovia BR-101',
            number: 'Km 45',
            complement: 'Canteiro Principal',
            neighborhood: 'Zona Industrial',
            city: 'Guarulhos',
            state: 'SP',
            zipCode: '07000-000'
        },
        mealTargets: { breakfast: 150, lunch: 300, dinner: 150, supper: 0 },
        menuComponents: { principal: 2, guarnicao: 1, salada: 1, sobremesa: 1, suco: 1 },
        fixedDishes: [
            { name: 'Arroz Branco', category: 'Principal' },
            { name: 'Feijão Carioca', category: 'Principal' }
        ],
        sanitaryDocs: [
            { type: 'Alvará', filePath: 'alvara_obras.pdf', expirationDate: '2025-12-31' }, // Vencido
            { type: 'Contrato', filePath: 'contrato_obras.pdf', expirationDate: '2026-06-30' }
        ],
        active: true
    },
    {
        name: 'UAN Clínica Bem-Estar',
        cnpj: '56.789.012/0001-34',
        type: 'Local',
        rtNutritionist: 'Dra. Fernanda Lima Rocha',
        address: {
            street: 'Rua das Acácias',
            number: '320',
            complement: 'Sala 5',
            neighborhood: 'Jardim Paulista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01440-000'
        },
        mealTargets: { breakfast: 30, lunch: 80, dinner: 60, supper: 20 },
        menuComponents: { principal: 1, guarnicao: 1, salada: 2, sobremesa: 1, suco: 1 },
        fixedDishes: [
            { name: 'Arroz Integral', category: 'Principal' },
            { name: 'Lentilha', category: 'Principal' },
            { name: 'Suco Verde', category: 'Suco' }
        ],
        sanitaryDocs: [
            { type: 'Alvará', filePath: 'alvara_clinica.pdf', expirationDate: '2026-11-30' },
            { type: 'PGR', filePath: 'pgr_clinica.pdf', expirationDate: '2026-07-15' },
            { type: 'Contrato', filePath: 'contrato_clinica.pdf', expirationDate: '2027-03-31' }
        ],
        active: true
    }
];

const createEmployees = (unitId, unitIndex) => {
    const baseDate = new Date('2025-02-18');
    const lastYear = '2025-01-15';
    const twoYearsAgo = '2024-01-15'; // Para testar status Inapto

    const employees = [
        {
            name: `Maria Santos ${unitIndex + 1}`,
            cpf: `${String(unitIndex * 100 + 1).padStart(3, '0')}.${String(unitIndex + 4)}56.789-0${unitIndex}`,
            rg: `${unitIndex + 1}2.345.678-9`,
            birthDate: '1985-03-15',
            gender: 'Feminino',
            phone: `(11) 9${unitIndex}456-7890`,
            email: `maria.santos${unitIndex + 1}@uan.com.br`,
            address: {
                street: 'Rua das Palmeiras',
                number: `${(unitIndex + 1) * 10}`,
                complement: 'Apto 2',
                neighborhood: 'Vila Nova',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234-567'
            },
            role: 'Cozinheira Chefe',
            unitId,
            employmentType: 'Próprio',
            hasFoodContact: true,
            admissionDate: '2020-03-01',
            health: {
                lastASO: lastYear,
                coprocultureDate: lastYear,
                coproparasitologyDate: lastYear,
                hygieneTrainingDate: lastYear
            },
            active: true
        },
        {
            name: `João Oliveira ${unitIndex + 1}`,
            cpf: `${String(unitIndex * 100 + 2).padStart(3, '0')}.${String(unitIndex + 5)}67.890-1${unitIndex}`,
            rg: `${unitIndex + 2}3.456.789-0`,
            birthDate: '1990-07-22',
            gender: 'Masculino',
            phone: `(11) 9${unitIndex}567-8901`,
            email: `joao.oliveira${unitIndex + 1}@uan.com.br`,
            address: {
                street: 'Av. Brasil',
                number: `${(unitIndex + 2) * 15}`,
                complement: '',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01310-000'
            },
            role: 'Auxiliar de Cozinha',
            unitId,
            employmentType: 'Próprio',
            hasFoodContact: true,
            admissionDate: '2021-06-15',
            health: {
                lastASO: twoYearsAgo, // Inapto - exame vencido
                coprocultureDate: twoYearsAgo,
                coproparasitologyDate: lastYear,
                hygieneTrainingDate: lastYear
            },
            active: true
        },
        {
            name: `Ana Lima ${unitIndex + 1}`,
            cpf: `${String(unitIndex * 100 + 3).padStart(3, '0')}.${String(unitIndex + 6)}78.901-2${unitIndex}`,
            rg: `${unitIndex + 3}4.567.890-1`,
            birthDate: '1992-11-08',
            gender: 'Feminino',
            phone: `(11) 9${unitIndex}678-9012`,
            email: `ana.lima${unitIndex + 1}@uan.com.br`,
            address: {
                street: 'Rua Flores',
                number: `${(unitIndex + 3) * 20}`,
                complement: 'Casa',
                neighborhood: 'Jardim',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '04567-890'
            },
            role: 'Nutricionista',
            unitId,
            employmentType: 'Próprio',
            hasFoodContact: false,
            admissionDate: '2022-01-10',
            health: {
                lastASO: lastYear,
                coprocultureDate: null,
                coproparasitologyDate: null,
                hygieneTrainingDate: null
            },
            active: true
        }
    ];

    return employees;
};

const seed = async () => {
    console.log('🌱 Iniciando seed via API HTTP...');

    try {
        // Verificar se API está online
        try {
            await axios.get(`${API_URL}/health`);
            console.log('✅ API Online!');
        } catch (e) {
            console.error('❌ API não está respondendo. Certifique-se que o backend está rodando na porta 3000.');
            process.exit(1);
        }

        // Inserir unidades
        console.log('🏢 Criando 5 unidades...');
        const createdUnits = [];
        for (const unitData of UNITS_DATA) {
            try {
                const response = await axios.post(`${API_URL}/units`, unitData);
                const unit = response.data.unit;
                createdUnits.push(unit);
                console.log(`  ✅ Unidade criada: ${unit.name} (ID: ${unit._id})`);
            } catch (e) {
                console.error(`  ❌ Erro ao criar unidade ${unitData.name}:`, e.response?.data || e.message);
            }
        }

        // Inserir colaboradores
        console.log('👥 Criando colaboradores (3 por unidade)...');
        let totalEmployees = 0;
        for (let i = 0; i < createdUnits.length; i++) {
            const unit = createdUnits[i];
            const employees = createEmployees(unit._id, i);
            for (const empData of employees) {
                try {
                    await axios.post(`${API_URL}/employees`, empData);
                    totalEmployees++;
                } catch (e) {
                    console.error(`  ❌ Erro ao criar colaborador ${empData.name}:`, e.response?.data || e.message);
                }
            }
            console.log(`  ✅ 3 colaboradores criados para: ${unit.name}`);
        }

        console.log('\n🎉 Seed via API concluído!');
        console.log(`   📊 ${createdUnits.length} unidades criadas`);
        console.log(`   👥 ${totalEmployees} colaboradores criados`);

    } catch (error) {
        console.error('❌ Erro no seed:', error.message);
    }
};

seed();
