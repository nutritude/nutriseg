import React, { useState, useEffect } from 'react';
import UnitFormModal from '../components/UnitFormModal';
import { useUnit } from '../contexts/UnitContext';
import UnitService from '../services/UnitService';
import { Building2, Plus, MapPin, AlertTriangle, CheckCircle, FileText, ChefHat, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const UnitsPage = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const { selectedUnit: selectedUnitContext, selectUnit } = useUnit();

    useEffect(() => {
        loadUnits();
    }, []);

    const loadUnits = async () => {
        try {
            setLoading(true);
            const data = await UnitService.getUnits(null);
            setUnits(data.units || []);
        } catch (error) {
            console.error('Error loading units:', error);
            setUnits([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUnit = () => {
        setSelectedUnit(null);
        setIsModalOpen(true);
    };

    const handleEditUnit = (unit) => {
        setSelectedUnit(unit);
        setIsModalOpen(true);
    };

    const handleSaveUnit = async (unitData) => {
        try {
            if (selectedUnit) {
                await UnitService.updateUnit(selectedUnit._id, unitData);
            } else {
                await UnitService.createUnit(unitData);
            }
            setIsModalOpen(false);
            loadUnits();
        } catch (error) {
            console.error('Error saving unit:', error);
            throw error;
        }
    };

    const handleDeleteUnit = (deletedId) => {
        setUnits(prev => prev.filter(u => u._id !== deletedId));
    };

    const getDocumentStatus = (unit) => {
        if (!unit.sanitaryDocs || unit.sanitaryDocs.length === 0) {
            return { color: 'text-gray-400', icon: FileText, label: 'Sem documentos' };
        }
        if (unit.hasExpiredDocs) {
            return { color: 'text-red-600', icon: AlertTriangle, label: 'Docs Vencidos' };
        }
        if (unit.docsExpiringWithin30Days && unit.docsExpiringWithin30Days.length > 0) {
            return { color: 'text-yellow-600', icon: AlertTriangle, label: 'Docs Vencendo' };
        }
        return { color: 'text-green-600', icon: CheckCircle, label: 'Conforme' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            {/* Header Padronizado */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 size={32} className="text-blue-600" />
                        Unidades Operacionais
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Gerenciando {units.length} UANs sob supervisão técnica.
                    </p>
                </div>
                <button
                    onClick={handleCreateUnit}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Nova Unidade
                </button>
            </div>

            {/* Units Grid - Otimizado para Notebook */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {units.map(unit => {
                    const docStatus = getDocumentStatus(unit);
                    const StatusIcon = docStatus.icon;

                    return (
                        <div
                            key={unit._id}
                            onClick={() => handleEditUnit(unit)}
                            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[320px]"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-800 text-xl group-hover:text-blue-600 transition-colors leading-tight mb-2">
                                            {unit.name}
                                        </h3>
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${unit.type === 'Local'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'bg-purple-50 text-purple-600'
                                            }`}>
                                            {unit.type}
                                        </span>
                                    </div>
                                    <div className={`p-3 rounded-2xl bg-slate-50 ${docStatus.color}`}>
                                        <StatusIcon size={24} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="text-sm font-bold text-slate-600 line-clamp-2">
                                            {unit.address?.city || 'Cidade não informada'}, {unit.address?.state || '--'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50/50 p-3 rounded-xl">
                                            <span className="block text-[8px] font-black uppercase text-slate-400 mb-1">Responsável</span>
                                            <span className="text-xs font-black text-slate-700 truncate block">{unit.rtNutritionist || '--'}</span>
                                        </div>
                                        <div className="bg-slate-50/50 p-3 rounded-xl">
                                            <span className="block text-[8px] font-black uppercase text-slate-400 mb-1">CNPJ Unidade</span>
                                            <span className="text-xs font-black text-slate-700 truncate block">{unit.cnpj || '--'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectUnit(unit);
                                    }}
                                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${selectedUnitContext?._id === unit._id
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                        : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-200'
                                        }`}
                                >
                                    {selectedUnitContext?._id === unit._id ? (
                                        <><CheckCircle size={16} /> Foco Ativo</>
                                    ) : (
                                        <><Target size={16} /> Selecionar UAN</>
                                    )}
                                </button>
                                
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta de Produção</span>
                                    <span className="text-xs font-black text-blue-600">
                                        {((unit.mealTargets?.breakfast || 0) + (unit.mealTargets?.lunch || 0) + (unit.mealTargets?.dinner || 0)) || 0} Refeições/dia
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {units.length === 0 && !loading && (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm px-10">
                    <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-8">
                        <Building2 size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Bem-vindo ao Gestor de Unidades!</h3>
                    <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
                        Sua lista de unidades está vazia ou o servidor de dados está sincronizando. 
                        Tente recarregar ou cadastre sua primeira UAN.
                    </p>
                    <button
                        onClick={handleCreateUnit}
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/40"
                    >
                        + Cadastrar UAN
                    </button>
                </div>
            )}

            {isModalOpen && (
                <UnitFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUnit}
                    onDelete={handleDeleteUnit}
                    unit={selectedUnit}
                />
            )}
        </motion.div>
    );
};

export default UnitsPage;
