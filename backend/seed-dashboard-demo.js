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
            sanitaryDocs: [{ name: 'Alvará Sanitário', expiryDate: '2023-12-31' }] // Vencido
        },
        {
            name: 'Restaurante Corporativo Tech',
            address: 'Rua Amauri, 250, Itaim Bibi, São Paulo - SP',
            location: { latitude: -23.5855, longitude: -46.6852 },
            active: true,
            sanitaryDocs: [{ name: 'Alvará Sanitário', expiryDate: '2025-06-30' }] // OK
        },
        {
            name: 'UAN Escolar Kids',
            address: 'Rua da Consolação, 1500, Consolação, São Paulo - SP',
            location: { latitude: -23.5533, longitude: -46.6533 },
            active: true,
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
            health: {
                lastASO: new Date().toISOString(), // OK
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
                        leftoverKg: 10
                    }
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
                        leftoverKg: 2
                    }
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

    console.log('--- Seed Concluído com Sucesso ---');
    process.exit(0);
}

seed().catch(err => {
    console.error('Erro no seed:', err);
    process.exit(1);
});
