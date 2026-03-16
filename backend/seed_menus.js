/**
 * Script de Seed para Cardápios
 * Popula o banco de dados com cardápios realistas para as unidades existentes
 * Uso: node seed_menus.js
 */
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const MENU_DATA = [
    {
        mealType: 'Almoço',
        dishes: [
            { name: 'Arroz Branco com Salsinha', category: 'Principal' },
            { name: 'Feijão Carioca Clássico', category: 'Principal' },
            { name: 'Frango Grelhado ao Ervas', category: 'Principal' },
            { name: 'Couve-flor Gratinada', category: 'Guarnição' },
            { name: 'Mix de Folhas com Tomate', category: 'Salada' },
            { name: 'Beterraba Cozida', category: 'Salada' },
            { name: 'Pudim de Leite Condensado', category: 'Sobremesa' },
            { name: 'Suco de Abacaxi com Hortelã', category: 'Suco' }
        ]
    },
    {
        mealType: 'Jantar',
        dishes: [
            { name: 'Arroz Integral com Linhaça', category: 'Principal' },
            { name: 'Lentilha com Bacon', category: 'Principal' },
            { name: 'Iscas de Carne com Cebola', category: 'Principal' },
            { name: 'Purê de Batata Cremoso', category: 'Guarnição' },
            { name: 'Salada de Repolho Colorida', category: 'Salada' },
            { name: 'Pepino com Gergelim', category: 'Salada' },
            { name: 'Gelatina de Morango', category: 'Sobremesa' },
            { name: 'Suco de Laranja Natural', category: 'Suco' }
        ]
    },
    {
        mealType: 'Almoço',
        dishes: [
            { name: 'Arroz à Grega Especial', category: 'Principal' },
            { name: 'Feijão Preto com Louro', category: 'Principal' },
            { name: 'Peixe Assado ao Molho de Ervas', category: 'Principal' },
            { name: 'Batata Rustica Alecrim', category: 'Guarnição' },
            { name: 'Salada VIP (Rúcula e Manga)', category: 'Salada' },
            { name: 'Cenoura Ralada com Passas', category: 'Salada' },
            { name: 'Mousse de Maracujá', category: 'Sobremesa' },
            { name: 'Suco de Limão Suíço', category: 'Suco' }
        ]
    }
];

const seedMenus = async () => {
    console.log('🌱 Iniciando seed de cardápios completos...');

    try {
        // 1. Obter Unidades
        const unitsRes = await axios.get(`${API_URL}/units`);
        const units = unitsRes.data.units;

        if (!units || units.length === 0) {
            console.error('❌ Nenhuma unidade encontrada. Execute o seed_api.js primeiro.');
            return;
        }

        console.log(`🏢 Unidades encontradas: ${units.length}`);

        // 2. Criar Cardápios para os próximos 3 dias para cada unidade
        const today = new Date();
        let totalCreated = 0;

        for (const unit of units) {
            console.log(`\n🍱 Gerando cardápios para: ${unit.name}`);

            for (let i = 0; i < 3; i++) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + i);
                const dateStr = targetDate.toISOString().slice(0, 10);

                // Criar Almoço e Jantar (se a unidade permitir)
                const mealsToCreate = ['Almoço'];
                if (unit.mealTargets?.dinner > 0) mealsToCreate.push('Jantar');

                for (const type of mealsToCreate) {
                    const template = MENU_DATA.find(m => m.mealType === type) || MENU_DATA[0];

                    const menuData = {
                        unit: unit._id,
                        date: dateStr,
                        meals: [{
                            type: type,
                            dishes: template.dishes.map(d => ({
                                ...d,
                                allergens: Math.random() > 0.7 ? ['Glúten'] : [],
                                safety: {
                                    targetTemp: d.category === 'Principal' || d.category === 'Guarnição' ? 60 : 10,
                                    actualTemp: '',
                                    sampleTaken: false
                                }
                            })),
                            stats: {
                                contractedQty: unit.mealTargets?.[type === 'Almoço' ? 'lunch' : 'dinner'] || 100
                            }
                        }]
                    };

                    try {
                        await axios.post(`${API_URL}/menus`, menuData);
                        totalCreated++;
                        console.log(`  ✅ [${dateStr}] ${type} criado`);
                    } catch (err) {
                        console.error(`  ❌ Erro ao criar cardápio:`, err.response?.data || err.message);
                    }
                }
            }
        }

        console.log(`\n🎉 Seed de cardápios concluído com sucesso!`);
        console.log(`📊 Total de sessões de refeições criadas: ${totalCreated}`);

    } catch (error) {
        console.error('❌ Falha crítica no seed de cardápios:', error.message);
    }
};

seedMenus();
