require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./src/infrastructure/database/models/Employee');
const Unit = require('./src/infrastructure/database/models/Unit');

const run = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gestao_uan_test');
        console.log('✅ Conectado.');

        // 1. Criar Unidade Fake
        const unit = await Unit.create({
            name: 'Unidade Debug',
            cnpj: '00.000.000/0000-00', // Unique index risk? Use random
            address: { street: 'Rua Debug' }
        });
        console.log('🏢 Unidade criada:', unit._id);

        // 2. Criar Employee Fake
        const emp = await Employee.create({
            name: 'Colaborador Teste Crash',
            cpf: '000.000.000-00',
            role: 'Tester',
            unitId: unit._id,
            active: false,
            inactiveReason: 'Afastado',
            inactiveSince: new Date()
        });
        console.log('👤 Colaborador criado (Inativo):', emp._id);

        // 3. Tentar Reativar (Lógica do Controller)
        console.log('⚡ Tentando reativar...');
        const id = emp._id;

        // Simulação do Controller
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('ID inválido');
        }

        const employee = await Employee.findByIdAndUpdate(
            id,
            {
                active: true,
                inactiveReason: null,
                inactiveSince: null,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!employee) throw new Error('Não encontrado na atualização');

        console.log('✅ SUCESSO! Colaborador reativado:', employee);

    } catch (error) {
        console.error('❌ CRASH/ERRO:', error);
    } finally {
        if (mongoose.connection) {
            // Limpar sujeira
            // await mongoose.connection.db.dropDatabase();
            await mongoose.disconnect();
            console.log('🔌 Desconectado.');
        }
    }
};

run();
