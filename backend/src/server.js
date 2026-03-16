const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Segurança: Protege o sistema contra vulnerabilidades web
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.send('🚀 Sistema de Gestão UAN - API Online e Segura');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`👨‍⚕️ Skill de Especialista em Saúde Ativada`);
});