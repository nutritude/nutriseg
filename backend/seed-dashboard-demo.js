const { db } = require('./src/infrastructure/database/firebase-admin');
const admin = require('firebase-admin');

async function seed() {
    console.log('--- Iniciando Seed de Demonstração Analítica ---');

    if (!db) {
        console.error('❌ Falha ao conectar ao banco de dados. Verifique suas credenciais.');
        process.exit(1);
    }

    // 1. Unidades com endereços reais
    const units = [
        {
            name: 'UAN - Hospital Central SP',
            address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP',
            location: { latitude: -23.5614, longitude: -46.6559 },
            active: true,
            rtNutritionist: 'Dra. Roberta Silva (CRN-3 12345)',
            sanitaryDocs: [{ name: 'Alvará Sanitário', expiryDate: '2023-12-31' }] // Vencido
        },
        {
            name: 'Restaurante Corporativo Tech',
            address: 'Rua Amauri, 250, Itaim Bibi, São Paulo - SP',
            location: { latitude: -23.5855, longitude: -46.6852 },
            active: true,
            rtNutritionist: 'Dra. Mariana Costa (CRN-3 98765)',
            sanitaryDocs: [{ name: 'Alvará Sanitário', expiryDate: '2025-06-30' }] // OK
        },
        {
            name: 'UAN Escolar Kids',
            address: 'Rua da Consolação, 1500, Consolação, São Paulo - SP',
            location: { latitude: -23.5533, longitude: -46.6533 },
            active: true,
            rtNutritionist: 'Dr. Felipe Oliveira (CRN-3 44556)',
            sanitaryDocs: [{ name: 'Alvará Sanitário', expiryDate: '2024-01-15' }] // Vencendo agora
        }
    ];

    const unitRefs = [];
    for (const u of units) {
        // Busca se já existe para não duplicar
        const snapshot = await db.collection('units').where('name', '==', u.name).get();
        let ref;
        if (snapshot.empty) {
            ref = await db.collection('units').add({
                ...u,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Unidade criada: ${u.name}`);
        } else {
            ref = snapshot.docs[0].ref;
            await ref.update({ ...u, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
            console.log(`Unidade atualizada: ${u.name}`);
        }
        unitRefs.push({ id: ref.id, ...u });
    }

    // 2. Funcionários com situações variadas de saúde
    const employees = [
        {
            name: 'João da Silva (Demo)',
            role: 'Cozinheiro Líder',
            unitId: unitRefs[0].id,
            active: true,
            status: 'Ativo',
            health: {
                lastASO: '2023-01-10', // Vencido
                coprocultureDate: '2023-01-10',
                coproparasitologyDate: '2023-01-10',
                hygieneTrainingDate: '2023-01-10'
            },
            correctiveActions: { training: true, medicalExams: true, others: 'Agendar exames urgentemente' }
        },
        {
            name: 'Maria Oliveira (Demo)',
            role: 'Auxiliar de Cozinha',
            unitId: unitRefs[1].id,
            active: true,
            status: 'Férias',
            health: {
                lastASO: new Date().toISOString(), // OK
                coprocultureDate: new Date().toISOString(),
                coproparasitologyDate: new Date().toISOString(),
                hygieneTrainingDate: new Date().toISOString()
            }
        },
        {
            name: 'Pedro Ramos (Demo)',
            role: 'Auxiliar de Cozinha',
            unitId: unitRefs[0].id,
            active: false,
            status: 'Afastado',
            health: {
                lastASO: new Date().toISOString(),
                coprocultureDate: new Date().toISOString(),
                coproparasitologyDate: new Date().toISOString(),
                hygieneTrainingDate: new Date().toISOString()
            }
        }
    ];

    for (const e of employees) {
        const snapshot = await db.collection('employees').where('name', '==', e.name).get();
        if (snapshot.empty) {
            await db.collection('employees').add({
                ...e,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Funcionário criado: ${e.name}`);
        }
    }

    // 3. Menus com desperdício alto para simular BI
    const menus = [
        {
            unitId: unitRefs[0].id,
            date: new Date().toISOString().split('T')[0],
            meals: [
                {
                    name: 'Almoço',
                    stats: {
                        producedQty: 500,
                        servedQty: 400,
                        contractedQty: 450,
                        restIngestaKg: 45.5, // ~9% do produzido
                        cookOnDuty: 'Chef Maria José',
                        leftoverKg: 10
                    },
                    dishes: [
                        {
                            id: 'd1', name: 'Arroz Branco', category: 'Principal', 
                            safety: { actualTemp: '65', auditor: 'Carlos Téc. Nutrição', measuredAt: new Date().toISOString() }
                        },
                        {
                            id: 'd2', name: 'Feijão Carioca', category: 'Principal',
                            safety: { actualTemp: '72', auditor: 'Carlos Téc. Nutrição', measuredAt: new Date().toISOString() }
                        },
                        {
                            id: 'd3', name: 'Carne Ensopada', category: 'Principal',
                            safety: { actualTemp: '45', auditor: 'Carlos Téc. Nutrição', measuredAt: new Date().toISOString(), deviationReason: 'Falha no banho maria', correctiveAction: 'Reaquecimento imediato' }
                        },
                        {
                            id: 'd4', name: 'Salada de Alface', category: 'Frio',
                            safety: { actualTemp: '8', auditor: 'Carlos Téc. Nutrição', measuredAt: new Date().toISOString() }
                        },
                        {
                            id: 'd5', name: 'Sorvete de Chocolate', category: 'Sobremesa',
                            safety: { actualTemp: '-15', auditor: 'Carlos Téc. Nutrição', measuredAt: new Date().toISOString() }
                        }
                    ]
                }
            ]
        },
        {
            unitId: unitRefs[1].id,
            date: new Date().toISOString().split('T')[0],
            meals: [
                {
                    name: 'Almoço',
                    stats: {
                        producedQty: 300,
                        servedQty: 295,
                        contractedQty: 300,
                        restIngestaKg: 3.2, // Baixo
                        cookOnDuty: 'Paulo Cozinheiro',
                        leftoverKg: 2
                    },
                    dishes: [
                        {
                            id: 'd6', name: 'Macarrão Bolonhesa', category: 'Prato Quente',
                            safety: { actualTemp: '70', arrivalTemp: '72', auditor: 'Joana (RT)', measuredAt: new Date().toISOString() }
                        },
                        {
                            id: 'd7', name: 'Sobremesa Pudim', category: 'Frio',
                            safety: { actualTemp: '12', arrivalTemp: '9', auditor: 'Joana (RT)', measuredAt: new Date().toISOString(), deviationReason: 'Geladeira perdendo rendimento', correctiveAction: null }
                        }
                    ]
                }
            ]
        }
    ];

    for (const m of menus) {
        await db.collection('menus').add({
            ...m,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Menu e desperdício registrados para ${unitRefs.find(u => u.id === m.unitId).name}`);
    }

    // 4. Logs de temperatura críticos
    const logs = [
        {
            unitId: unitRefs[0].id,
            equipment: 'Câmara Fria 01',
            temperature: 14.8, 
            isCompliant: false,
            measurementTime: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }
    ];

    for (const l of logs) {
        await db.collection('temperature_logs').add(l);
        console.log(`Log crítico (14.8°C) criado para ${unitRefs[0].name}`);
    }

    // 5. Checklist Submissions (Diversas Situações Analíticas)
    const submissions = [
        {
            unitId: unitRefs[0].id,
            date: new Date().toISOString(),
            template: 'cvs5_full',
            answers: [
                { questionText: 'Paredes e pisos com infiltração?', answer: 'NC' }, // Estrutura NC
                { questionText: 'Equipamento de ventilação limpo?', answer: 'C' },  // Estrutura C
                { questionText: 'Higiene das mãos frequente?', answer: 'C' },      // Higiene C
                { questionText: 'Planilha de monitoramento em dia?', answer: 'NC' } // Documentação NC
            ]
        },
        {
            unitId: unitRefs[1].id,
            date: new Date().toISOString(),
            template: 'cvs5_full',
            answers: [
                { questionText: 'Iluminação adequada?', answer: 'NC' },             // Estrutura NC
                { questionText: 'Uniforme completo e limpo?', answer: 'NC' },        // Higiene NC
                { questionText: 'Temperatura da geladeira 4°C?', answer: 'C' },   // Temperatura C
                { questionText: 'Presença de baratas no ralo?', answer: 'NC' }      // Pragas NC
            ]
        }
    ];

    for (const s of submissions) {
        await db.collection('checklists_submissions').add({
            ...s,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Auditoria completa registrada para ${unitRefs.find(u => u.id === s.unitId).name}`);
    }

    // 6. Solicitações (Manutenção / RH)
    const requests = [
        {
            unitId: unitRefs[0].id,
            unitName: unitRefs[0].name,
            type: 'EPIs',
            items: [{ name: 'Luvas Vinil', quantity: 20, unit: 'cx' }],
            title: 'Reposição Emergencial',
            description: 'Necessário reposição devido ao aumento de demanda.',
            priority: 'Critico',
            status: 'Pendente',
            date: new Date().toISOString()
        },
        {
            unitId: unitRefs[1].id,
            unitName: unitRefs[1].name,
            type: 'Descartáveis',
            items: [{ name: 'Papel Toalha', quantity: 10, unit: 'fardo' }],
            title: 'Insumos de Higiene',
            description: 'Estoque baixo identificado na última auditoria.',
            priority: 'Normal',
            status: 'Entregue',
            date: new Date().toISOString()
        }
    ];

    for (const r of requests) {
        await db.collection('requests').add({
            ...r,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Solicitação registrada para ${unitRefs.find(u => u.id === r.unitId).name}`);
    }

    // 7. Eventos de Treinamento
    const events = [
        {
            unitId: unitRefs[0].id,
            unitName: unitRefs[0].name,
            type: 'Treinamento',
            title: 'Higiene e Manipulação de Alimentos',
            duration: '120 min',
            status: 'Realizado',
            participantsCount: 15,
            date: new Date().toISOString(),
            eventPhotos: ['https://placehold.co/600x400?text=Treinamento+Higiene']
        },
        {
            unitId: unitRefs[1].id,
            unitName: unitRefs[1].name,
            type: 'Treinamento',
            title: 'Segurança no Trabalho (EPIs)',
            duration: '60 min',
            status: 'Realizado',
            participantsCount: 8,
            date: new Date().toISOString(),
            eventPhotos: ['https://placehold.co/600x400?text=Treinamento+EPIs']
        },
        {
            unitId: unitRefs[2].id,
            unitName: unitRefs[2].name,
            type: 'Treinamento',
            title: 'Prevenção de Incêndio',
            duration: '90 min',
            status: 'Agendado',
            date: new Date(Date.now() + 86400000).toISOString(),
            participantsCount: 0
        }
    ];

    for (const ev of events) {
        await db.collection('events').add({
            ...ev,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    console.log('Eventos de treinamento semeados.');

    // 8. Rotas de Visita (Reembolso)
    const routePlans = [
        {
            origin: 'Sede Administrativa',
            date: new Date().toISOString(),
            visits: [
                {
                    unitId: unitRefs[0].id,
                    unitName: unitRefs[0].name,
                    routeIda: 'Sede -> Hospital Central',
                    routeVolta: 'Hospital Central -> Sede',
                    kmVisit: 15.5,
                    tollCosts: 18.50,
                    tollReceipts: ['https://placehold.co/400x600?text=Pedagio+01'],
                    status: '#concluido'
                },
                {
                    unitId: unitRefs[1].id,
                    unitName: unitRefs[1].name,
                    routeIda: 'Hospital Central -> Restaurante Tech',
                    routeVolta: 'Restaurante Tech -> Sede',
                    kmVisit: 8.2,
                    tollCosts: 0,
                    status: '#concluido'
                }
            ]
        }
    ];

    for (const rp of routePlans) {
        await db.collection('route_plans').add({
            ...rp,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    console.log('Planos de rota semeados.');

    console.log('--- Seed Concluído com Sucesso ---');
    process.exit(0);
}

seed().catch(err => {
    console.error('Erro no seed:', err);
    process.exit(1);
});
