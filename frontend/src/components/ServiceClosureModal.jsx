import React, { useState, useEffect } from 'react';
import PDFService from '../services/PDFService';
import { X, Save, AlertTriangle, Thermometer, DollarSign, ChefHat, FileText, Sparkles, BarChart3 } from 'lucide-react';

const ServiceClosureModal = ({ isOpen, onClose, onSave, mealData, unit }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'items'

    // Stats Gerais
    const [stats, setStats] = useState({
        contractedQty: '',
        servedQty: '',
        restIngestaKg: '',
        cookOnDuty: '',
        comments: ''
    });

    // Stats por Item (Mapeado dos pratos existentes)
    const [dishStats, setDishStats] = useState([]);
    const [generatingLabel, setGeneratingLabel] = useState(null);

    useEffect(() => {
        if (mealData) {
            // Mapping English/Portuguese keys for targets
            const targetMap = {
                'Almoço': 'lunch',
                'Jantar': 'dinner',
                'Café da Manhã': 'breakfast',
                'Desjejum': 'breakfast',
                'Ceia': 'supper'
            };

            const targetKey = targetMap[mealData.type] || 'lunch';
            const unitTarget = unit?.mealTargets?.[targetKey] || 0;

            setStats({
                contractedQty: mealData.stats?.contractedQty || unitTarget || '',
                servedQty: mealData.stats?.servedQty || '',
                restIngestaKg: mealData.stats?.restIngestaKg || '',
                cookOnDuty: mealData.stats?.cookOnDuty || '',
                comments: mealData.stats?.comments || ''
            });

            // Inicializar state dos pratos com dados existentes ou vazios
            const initialDishes = mealData.dishes?.map(dish => ({
                _id: dish._id,
                name: dish.name,
                category: dish.category,
                operational: {
                    producedKg: dish.operational?.producedKg || '',
                    cleanLeftoverKg: dish.operational?.cleanLeftoverKg || '',
                    destination: dish.operational?.destination || 'Descarte',
                    reusageTemp: dish.operational?.reusageTemp || '',
                    reusageCoolingTemp: dish.operational?.reusageCoolingTemp || '',
                    reusageExpiry: dish.operational?.reusageExpiry ? dish.operational.reusageExpiry.split('T')[0] : ''
                }
            })) || [];
            setDishStats(initialDishes);
        }
    }, [mealData]);

    const handleStatChange = (e) => {
        const { name, value } = e.target;
        setStats(prev => ({ ...prev, [name]: value }));
    };

    const handleDishStatChange = (index, field, value) => {
        setDishStats(prev => {
            const newDishes = [...prev];
            newDishes[index].operational = { ...newDishes[index].operational, [field]: value };
            return newDishes;
        });
    };

    const handleGeneratePDF = () => {
        console.log("Generating PDF for:", mealData);
        if (activeUnit && mealData) {
            try {
                PDFService.generateServiceClosureReport(mealData, activeUnit.name);
            } catch (error) {
                console.error("PDF Generation Error:", error);
                alert("Erro ao gerar PDF: " + error.message);
            }
        }
    };

    const handleGenerateLabel = (dish) => {
        if (!dish.operational.reusageTemp || !dish.operational.reusageCoolingTemp) {
            alert("⚠️ Preencha as temperaturas de segurança antes de gerar a etiqueta.");
            return;
        }
        try {
            PDFService.generateReuseLabel(dish, activeUnit?.name);
        } catch (error) {
            alert("Erro ao gerar etiqueta: " + error.message);
        }
    };

    const calculateMetrics = () => {
        const contracted = Number(stats.contractedQty) || 0;
        const served = Number(stats.servedQty) || 0;

        const deviation = contracted > 0 ? served - contracted : 0;
        const deviationPercent = contracted > 0 ? (deviation / contracted) * 100 : 0;

        return { deviation, deviationPercent };
    };

    const metrics = calculateMetrics();
    const totalProduction = dishStats.reduce((acc, d) => acc + (Number(d.operational?.producedKg) || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validar RDC 216 nos itens
        for (const dish of dishStats) {
            if (dish.operational.destination === 'Reutilização') {
                if (!dish.operational.reusageTemp || !dish.operational.reusageCoolingTemp) {
                    alert(`⚠️ Item "${dish.name}": Temperaturas (Exposição e Resfriamento) são obrigatórias para Reutilização.`);
                    setActiveTab('items');
                    return;
                }
            }
        }

        onSave({
            stats: stats,
            dishes: dishStats // Enviar array completo de atualizações
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            📉 Fechamento Operacional Estratégico
                        </h3>
                        <p className="text-xs text-blue-100 opacity-90 uppercase tracking-widest font-black">
                            {mealData?.type || 'Refeição'} • {unit?.name}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {mealData?.stats?.servedQty && (
                            <button
                                onClick={handleGeneratePDF}
                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
                            >
                                <FileText size={14} /> Relatório PDF
                            </button>
                        )}
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50 shrink-0">
                    <button
                        onClick={() => setActiveTab('general')}
                        type="button"
                        className={`flex-1 py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'general'
                            ? 'bg-white text-uan-primary border-t-2 border-uan-primary'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <DollarSign size={16} /> Geral & Contrato
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        type="button"
                        className={`flex-1 py-3 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'items'
                            ? 'bg-white text-uan-primary border-t-2 border-uan-primary'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <ChefHat size={16} /> Gestão por Item
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-auto bg-gray-50/50 p-6">

                    {/* ABA GERAL */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-fade-in">

                            {/* AI Analysis Card */}
                            {mealData?.aiAnalysis?.content && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Sparkles size={100} />
                                    </div>
                                    <h4 className="text-blue-800 font-bold flex items-center gap-2 mb-2">
                                        <Sparkles size={18} /> Análise Inteligente (Nutricionista IA)
                                    </h4>
                                    <p className="text-sm text-blue-900 leading-relaxed">
                                        {mealData.aiAnalysis.content}
                                    </p>
                                    <span className="text-[10px] text-blue-400 mt-2 block uppercase tracking-wider font-bold">
                                        Gerado em: {new Date(mealData.aiAnalysis.generatedAt).toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Card Financeiro */}
                                <div className="bg-white p-5 rounded-lg border shadow-sm">
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                        <BarChart3 size={18} className="text-blue-600" />
                                        Métricas de Produtividade
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                            <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Meta Contrato</label>
                                            <input type="number" name="contractedQty" value={stats.contractedQty} onChange={handleStatChange} className="w-full bg-white p-2 border border-blue-200 rounded font-black text-blue-900 text-lg" />
                                        </div>
                                        <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                            <label className="block text-[10px] font-black text-indigo-600 uppercase mb-1">Real Servido</label>
                                            <input type="number" name="servedQty" value={stats.servedQty} onChange={handleStatChange} className="w-full bg-white p-2 border border-indigo-200 rounded font-black text-indigo-900 text-lg" />
                                        </div>
                                    </div>

                                    {/* Resumo do Desvio */}
                                    <div className={`mt-4 p-3 rounded-lg text-center border-2 ${metrics.deviation >= 0
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
                                        }`}>
                                        <span className="block text-[10px] font-black uppercase tracking-widest opacity-70">Desvio de Meta</span>
                                        <span className="text-2xl font-black">
                                            {metrics.deviation > 0 ? '+' : ''}{metrics.deviation} <span className="text-sm font-bold opacity-80 uppercase">refeições</span>
                                            <span className="text-sm ml-2 px-1.5 py-0.5 bg-white/50 rounded-md">
                                                {metrics.deviationPercent.toFixed(1)}%
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* Card Resto Ingesta Estratégico */}
                                <div className="bg-white p-5 rounded-lg border shadow-sm border-orange-100">
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                                        <AlertTriangle size={18} className="text-orange-600" />
                                        Desperdício (Resto Ingesta)
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="bg-orange-50/30 p-3 rounded-lg border border-orange-100">
                                            <label className="block text-[10px] font-black text-orange-600 uppercase mb-1">Peso Total no Lixo (Kg)</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" step="0.1" name="restIngestaKg" value={stats.restIngestaKg} onChange={handleStatChange} className="w-full bg-white p-2 border border-orange-200 rounded text-xl font-black text-gray-800" placeholder="0.0" />
                                                <span className="font-black text-gray-400">KG</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Percentual vs Produção</span>
                                            <span className="text-lg font-black text-slate-700">
                                                {totalProduction > 0 ? ((parseFloat(stats.restIngestaKg || 0) / totalProduction) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cozinheiro(a) Responsável do Turno</label>
                                <input 
                                    type="text" 
                                    name="cookOnDuty" 
                                    value={stats.cookOnDuty} 
                                    onChange={handleStatChange} 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" 
                                    placeholder="Ex: Maria José, Chef Paulo..." 
                                />
                            </div>

                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
                                <textarea name="comments" value={stats.comments} onChange={handleStatChange} className="w-full p-2 border rounded h-24 text-sm" placeholder="Ocorrências do dia, quebras de equipamento, clima, etc..."></textarea>
                            </div>
                        </div>
                    )}

                    {/* ABA ITENS */}
                    {activeTab === 'items' && (
                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden animate-fade-in">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="p-3 w-1/4">Prato</th>
                                            <th className="p-3 w-20 text-center">Produzido (Kg)</th>
                                            <th className="p-3 w-20 text-center">Prato Sujo (Kg)</th>
                                            <th className="p-3 w-20 text-center">Sobra Limpa (Kg)</th>
                                            <th className="p-3 w-32">Destino</th>
                                            <th className="p-3">Avaliação / Segurança</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dishStats.map((dish, idx) => (
                                            <tr key={dish._id} className="hover:bg-gray-50">
                                                <td className="p-3">
                                                    <span className="font-bold text-gray-800 block">{dish.name}</span>
                                                    <span className="text-xs text-gray-400 uppercase">{dish.category}</span>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" step="0.1"
                                                        value={dish.operational.producedKg}
                                                        onChange={(e) => handleDishStatChange(idx, 'producedKg', e.target.value)}
                                                        className="w-full p-1 border rounded text-center font-bold text-blue-600"
                                                        placeholder="0.0"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" step="0.1"
                                                        value={dish.operational.restoKg || ''}
                                                        onChange={(e) => handleDishStatChange(idx, 'restoKg', e.target.value)}
                                                        className="w-full p-1 border rounded text-center font-bold text-amber-600"
                                                        placeholder="0.0"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number" step="0.1"
                                                        value={dish.operational.cleanLeftoverKg}
                                                        onChange={(e) => handleDishStatChange(idx, 'cleanLeftoverKg', e.target.value)}
                                                        className={`w-full p-1 border rounded text-center font-bold text-emerald-600 ${Number(dish.operational.cleanLeftoverKg) > 2 ? 'bg-red-50 border-red-200' : ''
                                                            }`}
                                                        placeholder="0.0"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        value={dish.operational.destination}
                                                        onChange={(e) => handleDishStatChange(idx, 'destination', e.target.value)}
                                                        className="w-full p-1 border rounded bg-white text-xs"
                                                    >
                                                        <option>Descarte</option>
                                                        <option>Reutilização</option>
                                                        <option>Doação</option>
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    {dish.operational.destination !== 'Descarte' && (
                                                        <div className="flex flex-col gap-2 animate-fade-in">
                                                            <div className="flex gap-2 items-center">
                                                                <div className="relative group">
                                                                    <Thermometer size={14} className="absolute left-1 top-1.5 text-orange-500" />
                                                                    <input
                                                                        type="number" step="0.1"
                                                                        value={dish.operational.reusageTemp}
                                                                        onChange={(e) => handleDishStatChange(idx, 'reusageTemp', e.target.value)}
                                                                        className={`w-16 pl-5 pr-1 py-1 border rounded text-[10px] ${!dish.operational.reusageTemp ? 'border-red-300 bg-red-50' : 'border-orange-300'}`}
                                                                        placeholder="Expo"
                                                                        title="Temperatura de Exposição"
                                                                    />
                                                                </div>
                                                                <div className="relative group">
                                                                    <Thermometer size={14} className="absolute left-1 top-1.5 text-blue-500" />
                                                                    <input
                                                                        type="number" step="0.1"
                                                                        value={dish.operational.reusageCoolingTemp}
                                                                        onChange={(e) => handleDishStatChange(idx, 'reusageCoolingTemp', e.target.value)}
                                                                        className={`w-16 pl-5 pr-1 py-1 border rounded text-[10px] ${!dish.operational.reusageCoolingTemp ? 'border-red-300 bg-red-50' : 'border-blue-300'}`}
                                                                        placeholder="Resfria"
                                                                        title="Temperatura de Resfriamento"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 items-center">
                                                                <div className="flex flex-col">
                                                                    <label className="text-[8px] font-bold text-gray-400 uppercase leading-none mb-1">Validade Limite (CVS 5)</label>
                                                                    <input
                                                                        type="date"
                                                                        value={dish.operational.reusageExpiry}
                                                                        onChange={(e) => handleDishStatChange(idx, 'reusageExpiry', e.target.value)}
                                                                        className="w-24 p-1 border rounded text-[10px]"
                                                                    />
                                                                </div>
                                                                {dish.operational.destination === 'Reutilização' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGenerateLabel(dish)}
                                                                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-1.5 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1 text-[9px] font-bold"
                                                                        title="Gerar Etiqueta de Sobra"
                                                                    >
                                                                        <FileText size={12} /> ETIQUETA
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-uan-primary hover:bg-blue-900 text-white px-8 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
                    >
                        <Save size={18} />
                        Confirmar Fechamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceClosureModal;
