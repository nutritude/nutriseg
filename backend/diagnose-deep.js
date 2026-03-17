const admin = require('firebase-admin');
const fs = require('fs');

async function run() {
    console.log(`\n--- Testando Firebase Auth e Firestore ---`);
    try {
        const key = JSON.parse(fs.readFileSync('./src/infrastructure/database/firebase-key.json', 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(key)
        });

        console.log('1. Testando Firestore...');
        const db = admin.firestore();
        try {
            const snapshot = await db.collection('units').limit(1).get();
            console.log(`✅ Firestore OK: ${snapshot.size} docs encontrados.`);
        } catch (e) {
            console.error(`❌ Firestore FALHA: ${e.message}`);
        }

        console.log('\n2. Testando Admin Auth (listUsers)...');
        try {
            const listUsersResult = await admin.auth().listUsers(1);
            console.log(`✅ Auth OK: Encontrado ${listUsersResult.users.length} usuários.`);
        } catch (e) {
            console.error(`❌ Auth FALHA: ${e.message}`);
        }

        process.exit(0);
    } catch (e) {
        console.error(`❌ Erro Crítico na inicialização: ${e.message}`);
        process.exit(1);
    }
}

run();
