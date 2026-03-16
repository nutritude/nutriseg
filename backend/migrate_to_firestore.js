require('dotenv').config();
const mongoose = require('mongoose');
const { db } = require('./src/infrastructure/database/firebase-admin');

// Modelos ORIGINAIS do Mongoose para leitura
const UnitSchema = new mongoose.Schema({ name: String, cnpj: String, address: Object, type: String, rtNutritionist: String, mealTargets: Object, menuComponents: Object, fixedDishes: Array, sanitaryDocs: Array, active: Boolean }, { strict: false });
const EmployeeSchema = new mongoose.Schema({ name: String, cpf: String, unitId: mongoose.Schema.Types.ObjectId, active: Boolean }, { strict: false });

const OldUnit = mongoose.model('OldUnit', UnitSchema, 'units');
const OldEmployee = mongoose.model('OldEmployee', EmployeeSchema, 'employees');

const migrate = async () => {
    try {
        console.log('🚀 Iniciando Migração para Firestore...');

        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sistema-uan';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado ao MongoDB Local');

        // 1. Migrar Unidades
        const units = await OldUnit.find({});
        console.log(`🏢 Migrando ${units.length} unidades...`);

        const unitMap = {}; // Para mapear IDs antigos para novos

        for (const u of units) {
            const data = u.toObject();
            const oldId = data._id.toString();
            delete data._id;
            delete data.__v;

            const docRef = await db.collection('units').add({
                ...data,
                migratedFrom: oldId,
                updatedAt: new Date()
            });
            unitMap[oldId] = docRef.id;
            console.log(`   ✅ Unidade migrada: ${data.name} (${oldId} -> ${docRef.id})`);
        }

        // 2. Migrar Colaboradores
        const employees = await OldEmployee.find({});
        console.log(`👥 Migrando ${employees.length} colaboradores...`);

        for (const e of employees) {
            const data = e.toObject();
            const oldId = data._id.toString();
            delete data._id;
            delete data.__v;

            // Atualizar referência de UnitId
            if (data.unitId && unitMap[data.unitId.toString()]) {
                data.unitId = unitMap[data.unitId.toString()];
            }

            await db.collection('employees').add({
                ...data,
                migratedFrom: oldId,
                updatedAt: new Date()
            });
            console.log(`   ✅ Colaborador migrado: ${data.name}`);
        }

        console.log('\n🎉 Migração Concluída com Sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
};

migrate();
