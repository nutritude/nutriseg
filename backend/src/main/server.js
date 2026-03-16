require('dotenv').config();
const app = require('./config/app');
const connectDB = require('../infrastructure/database/connection');

// Global Error Handlers para evitar crashes silenciosos
process.on('uncaughtException', (err) => {
    console.error('❌ CRITICAL ERROR (Uncaught Exception):', err);
    // Não sair imediatamente em dev para permitir debug, ou sair com log
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ CRITICAL ERROR (Unhandled Rejection) em:', promise, 'motivo:', reason);
});

const startServer = async () => {
    try {
        // Conectar ao Banco de Dados (esperar a conexão ser estabelecida)
        await connectDB();

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`👨‍⚕️ Skill de Especialista em Saúde Ativada`);
        });
    } catch (error) {
        console.error('❌ Não foi possível iniciar o servidor:', error.message);
        process.exit(1);
    }
};

startServer();
