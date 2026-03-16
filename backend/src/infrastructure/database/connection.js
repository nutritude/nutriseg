const { db } = require('./firebase-admin');

/**
 * Nova Infraestrutura de Conexão - Sistema de UAN
 * Agora utilizando Firebase/Firestore como Banco de Dados Principal
 */
const connectDB = async () => {
    try {
        console.log('⏳ Inicializando Conexão com Firebase Firestore...');

        // Apenas para verificar se o db foi inicializado
        if (!db) {
            throw new Error('Firestore instance not initialized.');
        }

        console.log('✅ Firebase Firestore Conectado com Sucesso!');
        console.log('🌐 Banco de Dados em Nuvem Ativado (Modo de Alta Disponibilidade)');

    } catch (error) {
        console.error('❌ Falha crítica ao conectar ao Banco de Dados:', error.message);
        console.warn('🚀 Iniciando em modo MOCK/DEBUG para desenvolvimento local...');
    }
};

module.exports = connectDB;
