import React, { useState, useEffect } from 'react';
import { X, Thermometer, Clock, AlertTriangle, CheckCircle, Save, User, FileText, Calendar, Info } from 'lucide-react';
import PDFService from '../services/PDFService';

const TemperatureLogModal = ({ isOpen, onClose, meal, unit, onSave }) => {
    const [localDishes, setLocalDishes] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        console.log("TemperatureLogModal - Meal Data:", meal);
        if (meal && (meal.dishes || meal.items)) {
            const dishesToMap = meal.dishes || meal.items || [];
            setLocalDishes(dishesToMap.map(d => ({
                ...d,
                safety: {
                    ...d.safety,
                    arrivalTemp: d.safety?.arrivalTemp || '',
                    actualTemp: d.safety?.actualTemp || '',
                    deviationReason: d.safety?.deviationReason || '',
                    correctiveAction: d.safety?.correctiveAction || '',
                    sampleTaken: d.safety?.sampleTaken || false,
                    sampleCollectionTime: d.safety?.sampleCollectionTime || new Date().toISOString().slice(0, 16)
                }
            })));
        } else {
            setLocalDishes([]);
        }
    }, [meal, isOpen]);

    if (!isOpen || !meal) return null;

    const isTransported = unit?.type === 'Transportada';

    const handleTempChange = (idx, field, value) => {
        const updated = [...localDishes];
        updated[idx].safety[field] = value;

        if (!updated[idx].safety.measuredAt) {
            updated[idx].safety.measuredAt = new Date();
        }

        if (field === 'sampleTaken' && value === true) {
            PDFService.generateSampleLabel(updated[idx], unit?.name);
            if (!updated[idx].safety.sampleCollectionTime) {
                updated[idx].safety.sampleCollectionTime = new Date().toISOString().slice(0, 16);
            }
        }

        setLocalDishes(updated);
    };

    const validateCVS5 = (dish) => {
        const isHot = dish.category === 'Principal' || dish.category === 'Guarnição';
        const serviceTemp = parseFloat(dish.safety.actualTemp);
        const arrivalTemp = parseFloat(dish.safety.arrivalTemp);

        const serviceDeviant = isHot ? (serviceTemp > 0 && serviceTemp < 60) : (serviceTemp > 10);
        const arrivalDeviant = isTransported && (isHot ? (arrivalTemp > 0 && arrivalTemp < 60) : (arrivalTemp > 10));

        return {
            serviceDeviant: !!serviceTemp && serviceDeviant,
            arrivalDeviant: !!arrivalTemp && arrivalDeviant,
            needsAction: (!!serviceTemp && serviceDeviant) || (!!arrivalTemp && arrivalDeviant)
        };
    };

    const isFormValid = localDishes.length > 0 && localDishes.every(dish => {
        const { needsAction } = validateCVS5(dish);
        const hasService = !!dish.safety.actualTemp;
        const hasArrival = isTransported ? !!dish.safety.arrivalTemp : true;
        const hasAction = needsAction ? (!!dish.safety.correctiveAction && !!dish.safety.deviationReason) : true;
        return hasService && hasArrival && hasAction;
    });

    const handleInternalSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localDishes);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 scale-in-center">

                {/* Fixed Premium Header */}
                <div className="bg-white border-b border-slate-100 p-8 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-orange-600 text-white p-2 rounded-2xl shadow-lg shadow-orange-100">
                                <Thermometer size={24} />
                            </div>
                            <h3 className="font-black text-2xl text-slate-900 tracking-tighter">
                                Auditoria de Conformidade CVS 5 / RDC 216
                            </h3>
                        </div>
                        <div className="flex gap-6 items-center px-1">
                            <p className="text-[10px] text-blue-600 uppercase tracking-[0.2em] font-black">
                                {meal.type} • {unit?.name}
                            </p>
                            <div className="h-3 w-px bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                                <User size={12} className="text-slate-400" />
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                    Responsável: {unit?.rtNutritionist || 'Define RT'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-3xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable Form */}
                <div className="p-10 overflow-y-auto bg-slate-50/30 grow">
                    {localDishes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Info size={48} className="text-slate-200 mb-4" />
                            <h4 className="text-lg font-black text-slate-800">Nenhum alimento encontrado</h4>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">Não há pratos registrados nesta refeição para auditar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8">
                            {localDishes.map((dish, idx) => {
                                const validation = validateCVS5(dish);
                                const isHot = dish.category === 'Principal' || dish.category === 'Guarnição';

                                return (
                                    <div key={dish._id || idx} className={`bg-white p-8 rounded-[36px] border-2 transition-all duration-500 ${validation.needsAction ? 'border-red-100 shadow-xl shadow-red-500/5' : 'border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/30'}`}>
                                        <div className="flex flex-col lg:flex-row justify-between gap-10">
                                            {/* Dish Identity */}
                                            <div className="lg:max-w-xs flex-1">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                                        {dish.category}
                                                    </span>
                                                    <div className={`p-1.5 rounded-lg ${isHot ? 'bg-orange-50 text-orange-600' : 'bg-cyan-50 text-cyan-600'}`}>
                                                        <Clock size={12} />
                                                    </div>
                                                </div>
                                                <h4 className="font-black text-slate-900 text-xl leading-tight mb-2 tracking-tight">{dish.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Target: <span className={isHot ? 'text-orange-600' : 'text-cyan-600'}>{isHot ? '≥ 60°C' : '≤ 10°C'}</span>
                                                </p>
                                            </div>

                                            {/* Data Entry Section */}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap gap-8 items-end">
                                                    {isTransported && (
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Temp. Chegada</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number" step="0.1" inputMode="decimal"
                                                                    value={dish.safety.arrivalTemp}
                                                                    onChange={(e) => handleTempChange(idx, 'arrivalTemp', e.target.value)}
                                                                    className={`w-32 p-4 bg-slate-50 border-2 rounded-2xl font-black text-center text-xl focus:ring-8 outline-none transition-all ${validation.arrivalDeviant ? 'border-red-500 text-red-600 focus:ring-red-50' : 'border-slate-50 text-slate-800 focus:ring-blue-50 focus:bg-white'}`}
                                                                    placeholder="00.0"
                                                                />
                                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">°C</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Temp. Distribuição</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number" step="0.1" inputMode="decimal"
                                                                value={dish.safety.actualTemp}
                                                                onChange={(e) => handleTempChange(idx, 'actualTemp', e.target.value)}
                                                                className={`w-36 p-5 bg-slate-50 border-2 rounded-[24px] font-black text-center text-2xl focus:ring-12 outline-none transition-all ${validation.serviceDeviant ? 'border-red-500 text-red-600 focus:ring-red-50' : 'border-slate-50 text-slate-900 focus:ring-blue-50 focus:bg-white'}`}
                                                                placeholder="00.0"
                                                            />
                                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 font-bold">°C</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Protocolo de Amostra</label>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleTempChange(idx, 'sampleTaken', !dish.safety.sampleTaken)}
                                                                className={`grow h-[64px] px-6 rounded-3xl text-[11px] font-black flex items-center justify-center gap-3 transition-all border-2 ${dish.safety.sampleTaken ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-200' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}
                                                            >
                                                                <FileText size={20} />
                                                                {dish.safety.sampleTaken ? 'COLETADA' : 'RECOLHER'}
                                                            </button>

                                                            {dish.safety.sampleTaken && (
                                                                <div className="relative animate-in slide-in-from-left-4 grow">
                                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={dish.safety.sampleCollectionTime}
                                                                        onChange={(e) => handleTempChange(idx, 'sampleCollectionTime', e.target.value)}
                                                                        className="w-full h-[64px] bg-emerald-50 border-2 border-emerald-100 rounded-3xl pl-12 pr-4 text-[11px] font-black text-emerald-800 outline-none"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Critical Control Point Action Section */}
                                        {(validation.needsAction || (dish.safety.actualTemp && !validation.needsAction)) && (
                                            <div className={`mt-10 p-6 rounded-[28px] animate-in slide-in-from-top-4 duration-500 ${validation.needsAction ? 'bg-red-50 border border-red-100' : 'bg-emerald-50/50 border border-emerald-100/50'}`}>
                                                {validation.needsAction ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 px-1">
                                                                <AlertTriangle size={14} /> Causa da Não Conformidade
                                                            </label>
                                                            <select
                                                                value={dish.safety.deviationReason}
                                                                onChange={(e) => handleTempChange(idx, 'deviationReason', e.target.value)}
                                                                className="w-full p-4 bg-white border-2 border-red-100 rounded-2xl text-[13px] font-bold text-red-800 outline-none focus:ring-12 focus:ring-red-100/30 transition-all appearance-none cursor-pointer"
                                                            >
                                                                <option value="">Selecione o motivo técnico...</option>
                                                                <option value="Equipamento fora do padrão">Equipamento fora do padrão (Buffet/Forno)</option>
                                                                <option value="Atraso logístico">Atraso logístico (Transporte)</option>
                                                                <option value="Tempo de exposição excedido">Tempo de exposição excedido</option>
                                                                <option value="Falha operacional no reaquecimento">Falha operacional no reaquecimento</option>
                                                                <option value="Outros">Outros (Justificar na Medida)</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-red-600 uppercase flex items-center gap-2 px-1">
                                                                <Save size={14} /> Medida Corretiva Imediata (Obrigatória)
                                                            </label>
                                                            <textarea
                                                                value={dish.safety.correctiveAction}
                                                                onChange={(e) => handleTempChange(idx, 'correctiveAction', e.target.value)}
                                                                className="w-full p-4 bg-white border-2 border-red-100 rounded-2xl text-[13px] font-bold text-red-800 outline-none focus:ring-12 focus:ring-red-100/30 transition-all h-[58px] resize-none"
                                                                placeholder="Ex: Reaquecido e servido imediatamente..."
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4 text-emerald-700">
                                                        <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">
                                                            <CheckCircle size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[11px] uppercase tracking-widest leading-none mb-1">Status: Conforme</p>
                                                            <p className="text-[11px] font-bold opacity-70 italic tracking-tight">O alimento cumpre as exigências térmicas da CVS 5/2013 para o serviço em curso.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Premium Action Footer */}
                <div className="p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center px-12 shrink-0 gap-6">
                    <div className="max-w-lg hidden lg:block">
                        <div className="flex gap-3">
                            <div className="mt-1 h-3 w-3 bg-blue-100 rounded-full flex items-center justify-center">
                                <div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                <span className="text-slate-900 font-black uppercase tracking-widest mr-2">Declaração Técnica:</span>
                                Este relatório gera um log de auditoria rastreável. A falsificação ou omissão de dados térmicos compromete a segurança alimentar e está sujeita a penalidades sanitárias conforme RDC 216.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 md:flex-none px-10 py-5 rounded-3xl font-black text-[11px] text-slate-400 hover:text-slate-800 bg-slate-50 transition-all uppercase tracking-widest border border-transparent hover:border-slate-200"
                        >
                            Sair sem Salvar
                        </button>
                        <button
                            onClick={handleInternalSave}
                            disabled={!isFormValid || isSaving}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-16 py-5 rounded-3xl font-black text-[11px] transition-all shadow-2xl uppercase tracking-widest transform ${isFormValid ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/40 hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={20} />
                            )}
                            {isFormValid ? 'Finalizar Auditoria' : 'Auditoria Incompleta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemperatureLogModal;
