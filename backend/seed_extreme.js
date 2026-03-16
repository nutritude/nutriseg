const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const VARIETY_DATA = {
    'Almoço': [
        {
            dishes: [
                { name: 'Arroz Branco com Milho', category: 'Principal' },
                { name: 'Feijão Carioca', category: 'Principal' },
                { name: 'Filé de Frango Grelhado', category: 'Principal' },
                { name: 'Lasanha de Berinjela', category: 'Guarnição' },
                { name: 'Salada de Alface e Tomate', category: 'Salada' },
                { name: 'Maionese de Legumes', category: 'Salada' },
                { name: 'Gelatina de Morango', category: 'Sobremesa' },
                { name: 'Suco de Manga', category: 'Suco' }
            ]
        },
        {
            dishes: [
                { name: 'Arroz Integral', category: 'Principal' },
                { name: 'Feijão Preto com Louro', category: 'Principal' },
                { name: 'Carne Moída com Legumes', category: 'Principal' },
                { name: 'Farofa de Ovos', category: 'Guarnição' },
                { name: 'Salada de Repolho Roxo', category: 'Salada' },
                { name: 'Grão de Bico Temperado', category: 'Salada' },
                { name: 'Fruta da Estação (Melancia)', category: 'Sobremesa' },
                { name: 'Suco de Abacaxi', category: 'Suco' }
            ]
        }
    ],
    'Jantar': [
        {
            dishes: [
                { name: 'Arroz com Açafrão', category: 'Principal' },
                { name: 'Feijão Branco', category: 'Principal' },
                { name: 'Omelete de Legumes', category: 'Principal' },
                { name: 'Purê de Mandioquinha', category: 'Guarnição' },
                { name: 'Mix de Folhas Verdes', category: 'Salada' },
                { name: 'Pudim de Chocolate', category: 'Sobremesa' },
                { name: 'Suco de Laranja', category: 'Suco' }
            ]
        }
    ]
};

const seedExtreme = async () => {
    console.log('🚀 Iniciando Mega Seed de Cardápios...');

    try {
        const unitsRes = await axios.get(`${API_URL}/units`);
        const units = unitsRes.data.units;

        const today = new Date();

        for (const unit of units) {
            console.log(`\n🏢 Populando: ${unit.name}`);

            // Gerar para hoje, ontem e amanhã
            for (let offset = -1; offset <= 1; offset++) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + offset);
                const dateStr = targetDate.toISOString().slice(0, 10);

                const mealTypes = ['Almoço'];
                if (unit.mealTargets?.dinner > 0 || Math.random() > 0.5) mealTypes.push('Jantar');

                for (const type of mealTypes) {
                    const templates = VARIETY_DATA[type] || VARIETY_DATA['Almoço'];
                    const template = templates[Math.floor(Math.random() * templates.length)];

                    const menuData = {
                        unit: unit._id,
                        date: dateStr,
                        meals: [{
                            type: type,
                            dishes: template.dishes.map(d => ({
                                _id: Math.random().toString(36).substr(2, 9),
                                name: d.name,
                                category: d.category,
                                allergens: Math.random() > 0.8 ? ['Glúten', 'Lactose'] : [],
                                safety: {
                                    targetTemp: d.category === 'Principal' || d.category === 'Guarnição' ? 60 : 10,
                                    actualTemp: '',
                                    sampleTaken: false
                                }
                            })),
                            stats: {
                                contractedQty: unit.mealTargets?.[type.toLowerCase() === 'almoço' ? 'lunch' : 'dinner'] || 150
                            }
                        }]
                    };

                    try {
                        await axios.post(`${API_URL}/menus`, menuData);
                        console.log(`  ✅ [${dateStr}] ${type} criado.`);
                    } catch (e) {
                        // Ignorar erros de duplicidade se houver validação no backend
                    }
                }
            }
        }
        console.log('\n✨ Mega Seed finalizado com sucesso!');
    } catch (err) {
        console.error('❌ Erro no seed:', err.message);
    }
};

seedExtreme();
