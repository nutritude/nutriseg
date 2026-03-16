const { db } = require('./backend/src/infrastructure/database/firebase-admin');

async function checkData() {
    try {
        console.log('--- UNITS ---');
        const units = await db.collection('units').get();
        units.forEach(doc => console.log(doc.id, '=>', doc.data().name));

        console.log('\n--- EMPLOYEES ---');
        const employees = await db.collection('employees').get();
        console.log('Total employees:', employees.size);
        employees.forEach(doc => {
            const data = doc.data();
            console.log(doc.id, '=>', data.name, '| active:', data.active, '| unitId:', data.unitId);
        });

        console.log('\n--- MENUS ---');
        const menus = await db.collection('menus').get();
        console.log('Total menus:', menus.size);
        menus.forEach(doc => console.log(doc.id, '=>', doc.data().date, '(Unit:', doc.data().unitId, ')'));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
