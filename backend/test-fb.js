const admin = require('firebase-admin');
const fs = require('fs');

async function test() {
    try {
        const key = JSON.parse(fs.readFileSync('./src/infrastructure/database/firebase-key.json', 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(key)
        });
        const db = admin.firestore();
        const snapshot = await db.collection('units').limit(1).get();
        console.log("Success, got", snapshot.size, "documents");
        process.exit(0);
    } catch (e) {
        console.error("Error connecting to Firebase locally:", e.message);
        process.exit(1);
    }
}
test();
