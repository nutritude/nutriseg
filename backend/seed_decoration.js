const { db, admin } = require('./src/infrastructure/database/firebase-admin');

const decorationItems = [
    // Têxteis
    { name: 'Toalha Xadrez Vermelha', category: 'Têxteis', quantity: 10, unit: 'un' },
    { name: 'Caminho de Mesa Renda', category: 'Têxteis', quantity: 15, unit: 'un' },
    { name: 'Saia de Buffet Branca', category: 'Têxteis', quantity: 5, unit: 'un' },
    
    // Displays e Sinalização
    { name: 'Placa de Menu Retrô', category: 'Displays', quantity: 8, unit: 'un' },
    { name: 'Display de Mesa Acrílico', category: 'Displays', quantity: 20, unit: 'un' },
    { name: 'Testeira Temática Festival', category: 'Displays', quantity: 4, unit: 'un' },

    // Adereços e Decoração
    { name: 'Vaso de Cerâmica Marrom', category: 'Adereços', quantity: 12, unit: 'un' },
    { name: 'Cesto de Vime Grande', category: 'Adereços', quantity: 6, unit: 'un' },
    { name: 'Arranjo Girassóis (Artificais)', category: 'Adereços', quantity: 10, unit: 'un' },
    { name: 'Painel de Fundo Madeira', category: 'Adereços', quantity: 2, unit: 'un' },

    // Utensílios Especiais
    { name: 'Rechaud de Inox Duplo', category: 'Utensílios', quantity: 8, unit: 'un' },
    { name: 'Pegador Temático Madeira', category: 'Utensílios', quantity: 12, unit: 'un' },
    { name: 'Travessa de Porcelana Oval', category: 'Utensílios', quantity: 10, unit: 'un' }
];

async function seed() {
    console.log('🌱 Semeando itens de decoração...');
    const batch = db.batch();
    
    decorationItems.forEach(item => {
        const ref = db.collection('decoration_items').doc();
        batch.set(ref, {
            ...item,
            _id: ref.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    await batch.commit();
    console.log('✅ Itens semeados com sucesso!');
    process.exit();
}

seed().catch(err => {
    console.error('❌ Erro ao semear:', err);
    process.exit(1);
});
