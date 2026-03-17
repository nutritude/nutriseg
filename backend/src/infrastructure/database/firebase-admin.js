const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const initializeFirebase = () => {
    try {
        if (admin.apps.length === 0) {
            console.log('📡 [FIREBASE INIT] Iniciando processo de inicialização robusta...');

            let serviceAccount = null;

            // === MÉTODO 1: JSON Completo via ENV (Vercel) ===
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                try {
                    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                } catch (e) {
                    console.error('❌ Erro no parse de FIREBASE_SERVICE_ACCOUNT:', e.message);
                }
            }

            // === MÉTODO 2: Arquivo local via require (Prioritário para integridade) ===
            if (!serviceAccount) {
                const keyPath = path.join(__dirname, 'firebase-key.json');
                if (fs.existsSync(keyPath)) {
                    // require() trata o JSON e quebras de linha nativamente
                    serviceAccount = require(keyPath);
                }
            }

            // === TRATAMENTO DEFINITIVO DA CHAVE ===
            if (serviceAccount) {
                // Converte sequências literais '\n' em quebras de linha reais se necessário
                const privateKey = (serviceAccount.private_key || serviceAccount.privateKey || '')
                    .replace(/\\n/g, '\n');
                
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: serviceAccount.project_id || serviceAccount.projectId,
                        clientEmail: serviceAccount.client_email || serviceAccount.clientEmail,
                        privateKey: privateKey
                    })
                });
                console.log('✅ [FIREBASE INIT] Firebase Admin Inicializado para:', serviceAccount.project_id);
            } else if (process.env.FIREBASE_PRIVATE_KEY) {
                // Caso existam apenas variáveis individuais
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    })
                });
                console.log('✅ [FIREBASE INIT] Firebase Admin Inicializado via variáveis individuais.');
            } else {
                console.warn('⚠️  [FIREBASE INIT] Nenhuma credencial encontrada. Usando modo default.');
                admin.initializeApp({
                    projectId: "sistema-uan-producao"
                });
            }
        }
        return admin.firestore();
    } catch (error) {
        console.error('❌ [FIREBASE INIT CRITICAL ERROR]:', error.message);
        return null;
    }
};

const db = initializeFirebase();
module.exports = { admin, db };
