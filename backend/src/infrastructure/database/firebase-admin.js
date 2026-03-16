const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const initializeFirebase = () => {
    try {
        if (admin.apps.length === 0) {
            const keyPath = path.join(__dirname, 'firebase-key.json');

            if (fs.existsSync(keyPath)) {
                const serviceAccount = require(keyPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('✅ Firebase Admin Inicializado com Sucesso (Utilizando arquivo firebase-key.json)');
            } else {
                const privateKey = process.env.FIREBASE_PRIVATE_KEY
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                    : null;

                if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: privateKey
                        })
                    });
                    console.log('✅ Firebase Admin Inicializado com Sucesso (Utilizando Variáveis de Ambiente)');
                } else {
                    console.warn('⚠️  FIREBASE: Credenciais não encontradas. Usando modo de desenvolvimento/mock.');
                    admin.initializeApp({
                        projectId: "sistema-uan-dev"
                    });
                }
            }
        }
        return admin.firestore();
    } catch (error) {
        console.error('❌ Falha ao inicializar Firebase Admin:', error.message);
        throw error;
    }
};

module.exports = { admin, db: initializeFirebase() };

