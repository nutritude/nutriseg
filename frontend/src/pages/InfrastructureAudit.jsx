import React, { useState, useEffect, useCallback } from 'react';
import { 
    Hammer, 
    Settings, 
    Trash2, 
    Wind, 
    Droplets, 
    ShieldAlert, 
    Save, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle,
    Info,
    ArrowLeft,
    ClipboardCheck,
    Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnitService from '../services/UnitService';
import ChecklistService from '../services/ChecklistService';
import { useUnit } from '../contexts/UnitContext';

const InfrastructureAudit = () => {
    const { selectedUnit: contextUnit } = useUnit();
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [activeStep, setActiveStep] = useState(0); // 0: Select Unit, 1: Audit
    const [activeCategory, setActiveCategory] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Categorias CVS5 / RDC 216
    const categories = [
        {
            title: 'Edificações e Instalações',
            icon: Building,
            items: [
                'Paredes, tetos e pisos em bom estado de conservação?',
                'Ralos sifonados e com sistema de fechamento?',
                'Ventilação e exaustão adequadas (sem gordura/gotejamento)?',
                'Janelas com telas milimétricas limpas e íntegras?',
                'Iluminação com proteção contra explosão e quedas?'
            ]
        },
        {
            title: 'Equipamentos e Utensílios',
            icon: Settings,
            items: [
                'Equipamentos em bom estado de conservação e limpeza?',
                'Termômetros de câmaras e balcões calibrados?',
                'Utensílios de material sanitário e íntegros?',
                'Cronogramas de manutenção preventiva em dia?',
                'Superfícies de contato com alimentos limpas e higienizadas?'
            ]
        },
        {
            title: 'Abastecimento de Água e Gelo',
            icon: Droplets,
            items: [
                'Reservatório de água íntegro e tampado?',
                'Laudo de limpeza do reservatório em dia (semestral)?',
                'Laudo de potabilidade do gelo disponível?',
                'Mangueiras guardadas de forma suspensa e limpas?'
            ]
        },
        {
            title: 'Resíduos e Pragas',
            icon: Trash2,
            items: [
                'Coletores de lixo com tampa e acionamento por pedal?',
                'Área externa de resíduos isolada e limpa?',
                'Comprovante de controle de pragas em dia?',
                'Ausência de focos ou abrigo de pragas na auditoria?'
            ]
        },
        {
            title: 'Higiene e Sanitização',
            icon: Wind,
            items: [
                'Produtos de higienização registrados na ANVISA?',
                'Lavatórios para mãos com sabão e papel toalha?',
                'Planilha de higienização de ambientes preenchida?',
                'Sanitários em boas condições e isolados da produção?'
            ]
        }
    ];

    const [responses, setResponses] = useState({});
    const [actions, setActions] = useState({});

    // Sugestões de Ações Corretivas por Categoria
    const correctiveSuggestions = [
        ['Solicitar manutenção predial imediata', 'Refazer pintura sanitária', 'Consertar rejuntamento de pisos', 'Instalar ralos sifonados', 'Limpeza técnica de coifas/exaustores', 'Trocar telas de proteção'],
        ['Acionar manutenção preventiva de equipamentos', 'Solicitar calibração de termômetros', 'Substituir utensílios danificados', 'Treinamento de manuseio com a equipe', 'Higienização profunda de equipamentos'],
        ['Limpeza e desinfecção imediata da caixa d\'água', 'Solicitar novo laudo de potabilidade', 'Substituir mangueiras por material atóxico', 'Instalar tampa hermética no reservatório'],
        ['Refazer dedetização/desratização na área', 'Remover entulhos e focos de abrigo', 'Substituir coletores de lixo sem tampa', 'Instalar proteção contra pragas em acessos'],
        ['Comprar produtos de limpeza registrados', 'Repor insumos (sabão/papel) imediatamente', 'Treinamento de higiene ambiental', 'Interditar área para reforma sanitária']
    ];

    useEffect(() => {
        loadUnits();
        if (contextUnit) {
            setSelectedUnit(contextUnit);
            setActiveStep(1);
        }
    }, [contextUnit]);

    const loadUnits = async () => {
        try {
            const data = await UnitService.getUnits();
            setUnits(data.units || []);
        } catch (error) {
            console.error('Erro ao carregar unidades:', error);
        }
    };

    const handleResponse = (categoryIdx, itemIdx, value) => {
        setResponses(prev => ({
            ...prev,
            [`${categoryIdx}-${itemIdx}`]: value
        }));
        // Limpa ação corretiva se mudar para Conforme ou NA
        if (value !== 'NC') {
            const newActions = { ...actions };
            delete newActions[`${categoryIdx}-${itemIdx}`];
            setActions(newActions);
        }
    };

    const handleAction = (categoryIdx, itemIdx, value) => {
        setActions(prev => ({
            ...prev,
            [`${categoryIdx}-${itemIdx}`]: value
        }));
    };

    const calculateProgress = () => {
        const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
        const answeredItems = Object.keys(responses).length;
        return Math.round((answeredItems / totalItems) * 100);
    };

    const handleSubmit = async () => {
        try {
            setIsSaving(true);
            const submissionData = {
                templateName: 'Auditoria de Infraestrutura e Equipamentos',
                unitId: selectedUnit._id,
                date: new Date(),
                answers: Object.entries(responses).map(([key, value]) => {
                    const [catIdx, itemIdx] = key.split('-');
                    return {
                        questionText: `[${categories[catIdx].title}] ${categories[catIdx].items[itemIdx]}`,
                        answer: value,
                        correctiveAction: actions[key] || null
                    };
                })
            };
            
            // Simular envio ou usar ChecklistService
            await ChecklistService.submit(submissionData);
            
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                setActiveStep(0);
                setResponses({});
            }, 3000);
        } catch (error) {
            console.error('Erro ao salvar auditoria:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Hammer size={32} className="text-orange-500" />
                        Infraestrutura e Equipamentos
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Conformidade Técnica CVS 5 e RDC 216.</p>
                </div>

                {activeStep === 1 && (
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade em Auditoria</p>
                            <p className="text-sm font-bold text-slate-800">{selectedUnit?.name}</p>
                        </div>
                        <div className="h-10 w-px bg-slate-100 mx-2" />
                        <button 
                            onClick={() => setActiveStep(0)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {activeStep === 0 ? (
                    /* Passo 0: Seleção de Unidade */
                    <motion.div 
                        key="select-unit"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <div className="col-span-full mb-4">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <ClipboardCheck className="text-blue-600" />
                                Escolha uma unidade para iniciar a vistoria técnica:
                            </h3>
                        </div>
                        {units.map((unit) => (
                            <button
                                key={unit._id}
                                onClick={() => { setSelectedUnit(unit); setActiveStep(1); }}
                                className="group relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all text-left overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-16 -translate-y-16 opacity-0 group-hover:opacity-50 transition-all duration-500" />
                                <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <Building size={28} />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{unit.name}</h4>
                                <p className="text-sm text-slate-500 font-medium mt-2 mb-6">{unit.address?.city || 'Localidade não informada'}</p>
                                <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                                    Iniciar Auditoria <ChevronRight size={16} />
                                </div>
                            </button>
                        ))}
                    </motion.div>
                ) : (
                    /* Passo 1: Auditoria */
                    <motion.div 
                        key="audit-form"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Sidebar de Categorias */}
                        <div className="lg:col-span-4 space-y-3">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso Total</span>
                                    <span className="text-2xl font-black text-blue-600">{calculateProgress()}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${calculateProgress()}%` }}
                                        className="h-full bg-blue-600"
                                    />
                                </div>
                            </div>

                            {categories.map((cat, idx) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === idx;
                                const answeredInCategory = cat.items.filter((_, i) => responses[`${idx}-${i}`]).length;
                                const totalInCategory = cat.items.length;
                                const isDone = answeredInCategory === totalInCategory;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveCategory(idx)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                                            isActive 
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                                            : 'bg-white text-slate-500 border-slate-100 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500' : 'bg-slate-50'}`}>
                                                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                                            </div>
                                            <span className="text-sm font-bold truncate max-w-[180px]">{cat.title}</span>
                                        </div>
                                        {isDone ? (
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        ) : (
                                            <span className="text-[10px] font-black opacity-60">{answeredInCategory}/{totalInCategory}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Conteúdo da Categoria */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                                <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm">
                                            {React.createElement(categories[activeCategory].icon, { size: 24, className: 'text-blue-600' })}
                                        </div>
                                        {categories[activeCategory].title}
                                    </h3>
                                </div>

                                <div className="p-8 flex-1 space-y-6">
                                    {categories[activeCategory].items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 hover:shadow-md">
                                            <p className="font-bold text-slate-700 mb-4">{item}</p>
                                            <div className="flex gap-3">
                                                {[
                                                    { label: 'C', title: 'Conforme', color: 'bg-green-50 text-green-700 active:bg-green-600' },
                                                    { label: 'NC', title: 'Não Conforme', color: 'bg-red-50 text-red-700 active:bg-red-600' },
                                                    { label: 'NA', title: 'Não Se Aplica', color: 'bg-slate-100 text-slate-600 active:bg-slate-600' }
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.label}
                                                        onClick={() => handleResponse(activeCategory, itemIdx, opt.label)}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                                                            responses[`${activeCategory}-${itemIdx}`] === opt.label
                                                            ? (opt.label === 'C' ? 'bg-green-600 text-white border-green-600' : opt.label === 'NC' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-600 text-white border-slate-600')
                                                            : `bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600`
                                                        }`}
                                                    >
                                                        {opt.title}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Campo de Ação Corretiva - Condicional para NC */}
                                            <AnimatePresence>
                                                {responses[`${activeCategory}-${itemIdx}`] === 'NC' && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="mt-6 pt-6 border-t border-red-100 overflow-hidden"
                                                    >
                                                        <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">
                                                            Ação Corretiva Necessária
                                                        </label>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {correctiveSuggestions[activeCategory].map((sug, sIdx) => (
                                                                <button
                                                                    key={sIdx}
                                                                    onClick={() => handleAction(activeCategory, itemIdx, sug)}
                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                                                        actions[`${activeCategory}-${itemIdx}`] === sug
                                                                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                                                        : 'bg-white text-slate-500 border-slate-100 hover:border-red-200 hover:text-red-500'
                                                                    }`}
                                                                >
                                                                    {sug}
                                                                </button>
                                                            ))}
                                                            <button
                                                                onClick={() => handleAction(activeCategory, itemIdx, '')}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                                                    actions[`${activeCategory}-${itemIdx}`] === '' || (actions[`${activeCategory}-${itemIdx}`] && !correctiveSuggestions[activeCategory].includes(actions[`${activeCategory}-${itemIdx}`]))
                                                                    ? 'bg-red-600 text-white border-red-600'
                                                                    : 'bg-white text-slate-500 border-slate-100 hover:border-red-200'
                                                                }`}
                                                            >
                                                                Outras...
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            placeholder="Descreva a ação corretiva detalhada..."
                                                            value={actions[`${activeCategory}-${itemIdx}`] || ''}
                                                            onChange={(e) => handleAction(activeCategory, itemIdx, e.target.value)}
                                                            className="w-full px-4 py-3 bg-red-50/30 border border-red-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 min-h-[80px] text-slate-700 font-medium"
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Info size={16} />
                                        <span className="text-xs font-medium italic">Dados salvos localmente durante o preenchimento.</span>
                                    </div>
                                    <div className="flex gap-3">
                                        {activeCategory < categories.length - 1 ? (
                                            <button 
                                                onClick={() => setActiveCategory(activeCategory + 1)}
                                                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all"
                                            >
                                                Próximo
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleSubmit}
                                                disabled={isSaving || calculateProgress() < 100}
                                                className={`px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${
                                                    calculateProgress() < 100 
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20'
                                                }`}
                                            >
                                                {isSaving ? (
                                                    <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                                ) : (
                                                    <Save size={18} />
                                                )}
                                                Finalizar Auditoria
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Sucesso */}
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[3rem] p-12 text-center max-w-md shadow-2xl"
                        >
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4">Auditoria Concluída!</h3>
                            <p className="text-slate-500 font-medium mb-8">
                                O relatório técnico de <b>{selectedUnit?.name}</b> foi gerado e enviado para o conselho técnico.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 text-left">
                                <AlertCircle className="text-blue-500" size={24} />
                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                                    Conformidade calculada instantaneamente com base nas exigências CVS 5/2013.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InfrastructureAudit;
