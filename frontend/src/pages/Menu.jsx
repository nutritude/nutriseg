import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MenuService from '../services/MenuService';
import { useUnit } from '../contexts/UnitContext';
import {
    Plus, Calendar, ChefHat, Upload, Save, Trash2,
    CheckCircle, Info, Target, Building2, Thermometer,
    AlertTriangle, Filter, ArrowRight, Clock, MapPin, Search, ChevronRight
} from 'lucide-react';
import ServiceClosureModal from '../components/ServiceClosureModal';
import TemperatureLogModal from '../components/TemperatureLogModal';
import PDFService from '../services/PDFService';
import UnitService from '../services/UnitService';

const ALLERGENS = [
    { id: 'Glúten', label: 'Glúten', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: 'Lactose', label: 'Lactose', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    { id: 'Ovos', label: 'Ovos', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { id: 'Soja', label: 'Soja', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
];

const DISH_CATEGORIES = ['Principal', 'Guarnição', 'Salada', 'Sobremesa', 'Suco'];

const MenuPage = () => {
    const { selectedUnit: activeUnit, selectUnit } = useUnit();
    const [menus, setMenus] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isManualInput, setIsManualInput] = useState(false);
    const [activeTab, setActiveTab] = useState('daily');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Closure State
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [isTempLogOpen, setIsTempLogOpen] = useState(false);
    const [selectedMealForClosure, setSelectedMealForClosure] = useState(null);
    const [selectedMenuId, setSelectedMenuId] = useState(null);

    // Form States
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [mealType, setMealType] = useState('Almoço');
    const [dishesInput, setDishesInput] = useState({});

    // 1. Load Units (Once)
    useEffect(() => {
        let isMounted = true;
        const loadUnits = async () => {
            try {
                const data = await UnitService.getUnits();
                if (isMounted) setUnits(data.units || []);
            } catch (err) { console.error('Erro ao carregar unidades:', err); }
        };
        loadUnits();
        return () => { isMounted = false; };
    }, []);

    // 2. Initialize Dishes Input Helper
    const initializeDishesInput = useCallback((overrideUnit) => {
        const unitToUse = overrideUnit || activeUnit;
        if (!unitToUse?.menuComponents) {
            setDishesInput(DISH_CATEGORIES.reduce((acc, cat) => ({
                ...acc,
                [cat]: [{ _id: Math.random().toString(36).substr(2, 9), name: '', allergens: [], safety: { actualTemp: '', sampleTaken: false, correctiveAction: '' }, isFixedItem: false }]
            }), {}));
            return;
        }

        const initial = {};
        const map = { principal: 'Principal', guarnicao: 'Guarnição', salada: 'Salada', sobremesa: 'Sobremesa', suco: 'Suco' };

        Object.entries(unitToUse.menuComponents).forEach(([key, count]) => {
            const category = map[key];
            if (category) {
                const fixedInCategory = (unitToUse.fixedDishes || []).filter(d => d.category === category);
                initial[category] = Array.from({ length: Math.max(Number(count) || 1, 1) }, (v, i) => {
                    const fixedDish = fixedInCategory[i];
                    return {
                        _id: Math.random().toString(36).substr(2, 9),
                        name: fixedDish?.name || '',
                        allergens: fixedDish?.allergens || [],
                        isFixedItem: !!fixedDish,
                        safety: {
                            targetTemp: category === 'Principal' || category === 'Guarnição' ? 60 : 10,
                            actualTemp: '',
                            sampleTaken: false,
                            correctiveAction: ''
                        }
                    };
                });
            }
        });

        DISH_CATEGORIES.forEach(cat => {
            if (!initial[cat]) {
                initial[cat] = [{ _id: Math.random().toString(36).substr(2, 9), name: '', allergens: [], safety: { actualTemp: '', sampleTaken: false, correctiveAction: '' }, isFixedItem: false }];
            }
        });

        setDishesInput(initial);
    }, [activeUnit]);

    // 3. Main Data Effect (Depends on activeUnit ID)
    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (!activeUnit?._id) {
                if (isMounted) {
                    setMenus([]);
                    setLoading(false);
                }
                return;
            }

            try {
                if (isMounted) setLoading(true);
                const data = await MenuService.getAll(activeUnit._id);
                if (isMounted) {
                    setMenus(Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
                    initializeDishesInput(activeUnit);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Erro ao carregar dados da unidade:', err);
                if (isMounted) {
                    setMenus([]);
                    setLoading(false);
                }
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [activeUnit?._id, initializeDishesInput]);

    // Filtering logic
    const filteredMenus = menus.filter(menu => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            menu.date.includes(searchLower) ||
            menu.meals.some(meal =>
                meal.type.toLowerCase().includes(searchLower) ||
                meal.dishes.some(dish => dish.name.toLowerCase().includes(searchLower))
            )
        );
    });

    const handleDishChange = (category, index, field, value) => {
        setDishesInput(prev => {
            const currentCategory = prev[category] || [];
            const newCategoryDishes = [...currentCategory];
            if (!newCategoryDishes[index]) return prev;

            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                newCategoryDishes[index] = {
                    ...newCategoryDishes[index],
                    [parent]: { ...newCategoryDishes[index][parent], [child]: value }
                };
            } else {
                newCategoryDishes[index] = { ...newCategoryDishes[index], [field]: value };
            }
            return { ...prev, [category]: newCategoryDishes };
        });
    };

    const toggleAllergen = (category, index, allergen) => {
        setDishesInput(prev => {
            const currentCategory = prev[category] || [];
            const newCategoryDishes = [...currentCategory];
            if (!newCategoryDishes[index]) return prev;

            const currentAllergens = newCategoryDishes[index].allergens || [];
            const newAllergens = currentAllergens.includes(allergen)
                ? currentAllergens.filter(a => a !== allergen)
                : [...currentAllergens, allergen];
            newCategoryDishes[index] = { ...newCategoryDishes[index], allergens: newAllergens };
            return { ...prev, [category]: newCategoryDishes };
        });
    };

    const addDishField = (category) => {
        setDishesInput(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), { _id: Math.random().toString(36).substr(2, 9), name: '', allergens: [], safety: { actualTemp: '', sampleTaken: false, correctiveAction: '' }, isFixedItem: false }]
        }));
    };

    const removeDishField = (category, index) => {
        if ((dishesInput[category]?.length || 0) <= 1) return;
        setDishesInput(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }));
    };

    const handleSaveMenu = async () => {
        if (!date || !mealType) return alert('Preencha a data e o tipo de refeição');

        const allDishes = Object.entries(dishesInput).flatMap(([category, items]) =>
            items.filter(item => item && item.name && item.name.trim() !== '').map(item => ({
                _id: item._id || Math.random().toString(36).substr(2, 9),
                name: item.name,
                category: category,
                allergens: item.allergens || [],
                safety: item.safety || {}
            }))
        );

        if (allDishes.length === 0) return alert('Adicione pelo menos um item ao cardápio');

        try {
            const menuData = {
                unit: activeUnit._id,
                date,
                meals: [{
                    type: mealType,
                    dishes: allDishes,
                    stats: { contractedQty: activeUnit.mealTargets?.[mealType.toLowerCase()] || 0 }
                }]
            };
            await MenuService.create(menuData);
            alert('Cardápio salvo com sucesso!');
            setShowForm(false);
            const data = await MenuService.getAll(activeUnit._id);
            setMenus(Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
        } catch (error) {
            console.error('Erro ao salvar cardápio:', error);
            alert('Falha ao salvar cardápio');
        }
    };

    const handleSaveTemperatures = async (temperatures) => {
        try {
            await MenuService.updateMealStats(selectedMenuId, selectedMealForClosure._id, { dishes: temperatures });
            setIsTempLogOpen(false);
            const data = await MenuService.getAll(activeUnit._id);
            setMenus(Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
        } catch (error) { console.error('Erro ao salvar temperaturas:', error); }
    };

    const handleSaveClosure = async (stats) => {
        try {
            await MenuService.updateMealStats(selectedMenuId, selectedMealForClosure._id, { stats: stats });
            setIsClosureModalOpen(false);
            const data = await MenuService.getAll(activeUnit._id);
            setMenus(Array.isArray(data) ? data.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
        } catch (error) { console.error('Erro ao salvar fechamento:', error); }
    };

    if (loading && !menus.length) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-bold animate-pulse">Carregando Planejamentos...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased">
            {/* Elegant Sticky Header */}
            <div className="bg-white/80 border-b border-slate-200/60 shadow-sm sticky top-0 z-40 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                        <div className="flex-1">
                            {activeUnit ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-200">
                                            <Building2 size={16} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Unidade em Foco</span>
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{activeUnit.name}</h1>
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-600 border border-slate-200">
                                            <Target size={12} className="text-blue-500" />
                                            Meta: {activeUnit.mealTargets?.lunch || 0}
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-bold text-slate-600 border border-slate-200">
                                            <ChefHat size={12} className="text-blue-500" />
                                            RT: {activeUnit.rtNutritionist || 'A definir'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Cardápio Digital</h1>
                                    <p className="text-slate-400 font-medium text-sm">Controle de produção, sobras e auditoria térmica CVS 5.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto items-center">
                            {/* Unit Filter Dropdown */}
                            <div className="relative group w-full md:w-72">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors" size={18} />
                                <select
                                    value={activeUnit?._id || ''}
                                    onChange={(e) => {
                                        const unitId = e.target.value;
                                        const found = units.find(u => u._id === unitId);
                                        selectUnit(found || null);
                                    }}
                                    className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-[13px] font-black text-slate-800 hover:border-blue-300 focus:ring-8 focus:ring-blue-50 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                                >
                                    <option value="">Alternar entre Unidades...</option>
                                    {units.map(unit => (
                                        <option key={unit._id} value={unit._id}>{unit.name}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                            </div>

                            {activeUnit && (
                                <button
                                    onClick={() => {
                                        setIsManualInput(true);
                                        setShowForm(true);
                                    }}
                                    className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95"
                                >
                                    <Plus size={20} className="text-blue-500" />
                                    Novo Planejamento
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-10">
                {!activeUnit && (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-24 h-24 rounded-[28px] flex items-center justify-center text-white shadow-xl mb-10 transform -rotate-6">
                            <Building2 size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4">Escolha uma Unidade Operacional</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-10 text-center font-bold">
                            Selecione a UAN que deseja gerenciar para visualizar o histórico de cardápios e auditorias térmicas.
                        </p>
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>)}
                        </div>
                    </div>
                )}

                {/* Modern Form Section */}
                {showForm && activeUnit && (
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-10 duration-500 mb-12">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8 border-b border-slate-50 pb-10">
                            <div>
                                <h3 className="font-black text-4xl text-slate-900 tracking-tighter mb-2">Montar Cardápio</h3>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Defina a programação técnica diária</p>
                            </div>

                            <div className="flex flex-wrap gap-6 w-full lg:w-auto">
                                <div className="flex flex-col flex-1 min-w-[200px]">
                                    <label className="text-[10px] uppercase font-black text-slate-400 mb-2 pl-1 tracking-widest">Data Programada</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1 min-w-[200px]">
                                    <label className="text-[10px] uppercase font-black text-slate-400 mb-2 pl-1 tracking-widest">Tipo de Serviço</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                                        <select
                                            value={mealType}
                                            onChange={(e) => setMealType(e.target.value)}
                                            className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="Almoço">Almoço</option>
                                            <option value="Jantar">Jantar</option>
                                            <option value="Café da Manhã">Café da Manhã</option>
                                            <option value="Ceia">Ceia</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-16">
                            {DISH_CATEGORIES.map(category => (
                                <div key={category}>
                                    <div className="flex justify-between items-center mb-8">
                                        <h4 className="font-black text-slate-800 text-2xl flex items-center gap-4">
                                            <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
                                            {category}
                                        </h4>
                                        <button
                                            onClick={() => addDishField(category)}
                                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            + {category}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {(dishesInput[category] || []).map((dish, idx) => (
                                            <div key={dish._id || idx} className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100/50 hover:border-blue-200 transition-all group flex flex-col gap-6 relative">
                                                <div className="grow">
                                                    <input
                                                        type="text"
                                                        disabled={dish.isFixedItem}
                                                        placeholder={`Digite o nome do prato...`}
                                                        value={dish.name || ''}
                                                        onChange={(e) => handleDishChange(category, idx, 'name', e.target.value)}
                                                        className={`w-full bg-transparent border-b-2 border-slate-200 px-2 py-3 outline-none text-lg font-black transition-all ${dish.isFixedItem ? 'text-slate-400 italic' : 'focus:border-blue-600 text-slate-800'}`}
                                                    />
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {ALLERGENS.map(allergen => (
                                                        <button
                                                            key={allergen.id}
                                                            onClick={() => toggleAllergen(category, idx, allergen.id)}
                                                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border-2 ${(dish.allergens || []).includes(allergen.id)
                                                                ? allergen.color + ' border-transparent shadow-md scale-105'
                                                                : 'bg-white text-slate-300 border-slate-50 hover:border-slate-200'
                                                                }`}
                                                        >
                                                            {allergen.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {!dish.isFixedItem && (
                                                    <button
                                                        onClick={() => removeDishField(category, idx)}
                                                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-20 flex flex-col md:flex-row justify-end gap-4 pt-10 border-t border-slate-100">
                            <button onClick={() => setShowForm(false)} className="px-10 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-800 transition-colors">Cancelar</button>
                            <button
                                onClick={handleSaveMenu}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-16 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 transition-all hover:scale-105"
                            >
                                <Save size={20} className="mr-2" />
                                Publicar Plano de Refeição
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard View */}
                {!showForm && activeUnit && (
                    <div className="space-y-12 pb-20">
                        {/* Summary Bar */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex-1 w-full relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-600" size={20} />
                                <input
                                    type="text"
                                    placeholder="Procurar por prato, data ou status..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-16 pr-8 py-4 bg-slate-50 border-none rounded-[20px] text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                                />
                            </div>
                            <div className="flex items-center gap-10 px-6">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total</p>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{filteredMenus.length}</p>
                                </div>
                                <div className="h-10 w-px bg-slate-100"></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Pendentes</p>
                                    <p className="text-2xl font-black text-orange-500 leading-none">{filteredMenus.filter(m => m.status !== '#concluido').length}</p>
                                </div>
                            </div>
                        </div>

                        {filteredMenus.length === 0 ? (
                            <div className="bg-white p-32 rounded-[40px] border border-slate-50 text-center shadow-lg">
                                <Calendar size={64} className="mx-auto text-slate-100 mb-6" />
                                <p className="text-slate-400 font-bold text-lg">Nenhum cardápio encontrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {filteredMenus.map(menu => (
                                    <div key={menu._id} className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/20 overflow-hidden transform transition-all hover:scale-[1.005]">
                                        {/* Card Header */}
                                        <div className="bg-slate-950 px-10 py-7 flex flex-wrap justify-between items-center gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="bg-blue-600 text-white h-16 w-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg shadow-blue-900/40">
                                                    <span className="text-2xl leading-none">{new Date(menu.date + 'T00:00:00').getDate()}</span>
                                                    <span className="text-[10px] uppercase tracking-widest">{new Date(menu.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-black text-xl uppercase tracking-tighter">
                                                        {new Date(menu.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                                                    </h4>
                                                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                                        <CheckCircle size={10} /> PROGRAMAÇÃO TÉCNICA CVS 5
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${menu.status === '#concluido' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                    {menu.status === '#concluido' ? 'SERVIÇO FINALIZADO' : 'PLANEJADO'}
                                                </div>
                                                <button className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                                            </div>
                                        </div>

                                        <div className="p-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                                {(menu.meals || []).map((meal, mIdx) => (
                                                    <div key={mIdx} className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 flex flex-col h-full hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group/card">
                                                        <div className="flex justify-between items-start mb-8">
                                                            <div>
                                                                <h5 className="font-black text-slate-900 text-2xl tracking-tighter uppercase">{meal.type}</h5>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessão {mIdx + 1}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1 rounded-lg border border-slate-100 text-[10px] font-black text-slate-600">
                                                                #{meal.stats?.contractedQty || 0}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-5 flex-1">
                                                            {(meal.dishes || []).map((dish, dIdx) => (
                                                                <div key={dish._id || dIdx} className="relative pl-5 before:absolute before:left-0 before:top-2 before:w-1 before:h-10 before:bg-blue-200 before:rounded-full group-hover/card:before:bg-blue-600 before:transition-all">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{dish.category}</span>
                                                                    </div>
                                                                    <h6 className="text-[15px] font-black text-slate-800 leading-tight mb-2">{dish.name}</h6>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {dish.allergens?.map(a => (
                                                                            <span key={a} className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-black uppercase">! {a}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="mt-10 pt-8 border-t border-slate-100 flex gap-3">
                                                            <button
                                                                onClick={() => { setSelectedMenuId(menu._id); setSelectedMealForClosure(meal); setIsTempLogOpen(true); }}
                                                                className="flex-1 bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                                                            >
                                                                <Thermometer size={14} className="text-blue-500" /> Auditoria
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedMenuId(menu._id); setSelectedMealForClosure(meal); setIsClosureModalOpen(true); }}
                                                                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle size={14} /> Fechar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ServiceClosureModal
                isOpen={isClosureModalOpen}
                onClose={() => setIsClosureModalOpen(false)}
                onSave={handleSaveClosure}
                mealData={selectedMealForClosure || {}}
                unit={activeUnit}
            />
            <TemperatureLogModal
                isOpen={isTempLogOpen}
                onClose={() => setIsTempLogOpen(false)}
                meal={selectedMealForClosure}
                unit={activeUnit}
                onSave={handleSaveTemperatures}
            />
        </div>
    );
};

export default MenuPage;
