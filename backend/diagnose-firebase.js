const admin = require('firebase-admin');
const fs = require('fs');

async function testVariation(name, config) {
    console.log(`\n--- Testando Variação: ${name} ---`);
    try {
        // Limpa apps existentes para re-inicializar
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }

        admin.initializeApp({
            credential: admin.credential.cert(config)
        });

        const db = admin.firestore();
        const start = Date.now();
        const snapshot = await db.collection('diagnostics').limit(1).get();
        console.log(`✅ SUCESSO (${Date.now() - start}ms): Conectado ao projeto ${config.projectId || config.project_id}`);
        return true;
    } catch (e) {
        console.error(`❌ FALHA: ${e.message}`);
        if (e.stack && e.stack.includes('UNAUTHENTICATED')) {
            console.error('   Motivo: Erro de Autenticação (Chave pode ser inválida)');
        }
        return false;
    }
}

async function run() {
    const rawKey = JSON.parse(fs.readFileSync('./src/infrastructure/database/firebase-key.json', 'utf8'));

    // Variação 1: Original
    await testVariation('Arquivo JSON Original', rawKey);

    // Variação 2: Tratando \n manualmente
    const fixedKey = { ...rawKey };
    fixedKey.private_key = rawKey.private_key.replace(/\\n/g, '\n');
    await testVariation('Private Key com \\n substituído', fixedKey);

    // Variação 3: Private Key sem headers (só o base64) - Frequentemente causa erro mas testamos
    const strippedKey = { ...rawKey };
    strippedKey.private_key = rawKey.private_key
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\n/g, '')
        .trim();
    await testVariation('Private Key Raw (sem headers)', strippedKey);

    // Variação 4: Verificando se o email está correto
    console.log(`\nInfo da conta de serviço:`);
    console.log(`Project ID: ${rawKey.project_id}`);
    console.log(`Client Email: ${rawKey.client_email}`);
    
    process.exit(0);
}

run();
