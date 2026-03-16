import React, { useState, useEffect } from 'react';
import UnitFormModal from '../components/UnitFormModal';
import { useUnit } from '../contexts/UnitContext';
import UnitService from '../services/UnitService';
import { Building2, Plus, MapPin, AlertTriangle, CheckCircle, FileText, ChefHat, Target } from 'lucide-react';

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
            return { color: 'text-red-600', icon: AlertTriangle, label: 'Documentos vencidos' };
        }

        if (unit.docsExpiringWithin30Days && unit.docsExpiringWithin30Days.length > 0) {
            return { color: 'text-yellow-600', icon: AlertTriangle, label: 'Documentos vencendo' };
        }

        return { color: 'text-green-600', icon: CheckCircle, label: 'Documentos OK' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Carregando unidades...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        Gestão de Unidades
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1">
                        {units.length} unidade{units.length !== 1 ? 's' : ''} cadastrada{units.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={handleCreateUnit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Unidade
                </button>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {units.map(unit => {
                    const docStatus = getDocumentStatus(unit);
                    const StatusIcon = docStatus.icon;

                    return (
                        <div
                            key={unit._id}
                            onClick={() => handleEditUnit(unit)}
                            className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                                        {unit.name}
                                    </h3>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${unit.type === 'Local'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        {unit.type}
                                    </span>
                                </div>
                                <StatusIcon size={20} className={docStatus.color} />
                            </div>

                            {/* Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2 text-slate-600">
                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">
                                        {unit.address?.city || 'Endereço não informado'}, {unit.address?.state || ''}
                                    </span>
                                </div>
                                <div className="text-slate-600">
                                    <span className="font-medium">RT:</span> {unit.rtNutritionist || 'Não informado'}
                                </div>
                                <div className="text-slate-600">
                                    <span className="font-medium">CNPJ:</span> {unit.cnpj || 'Não informado'}
                                </div>
                            </div>

                            {/* Section: Action to select unit */}
                            <div className="mt-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectUnit(unit);
                                    }}
                                    className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${selectedUnitContext?._id === unit._id
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
                                        }`}
                                >
                                    {selectedUnitContext?._id === unit._id ? (
                                        <>
                                            <CheckCircle size={16} /> Unidade Ativa
                                        </>
                                    ) : (
                                        <>
                                            <Target size={16} /> Selecionar Unidade
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                {/* Meal Targets */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500 font-medium">Meta Diária:</span>
                                    <span className="text-sm font-bold text-blue-600">
                                        {(unit.mealTargets?.breakfast || 0) +
                                            (unit.mealTargets?.lunch || 0) +
                                            (unit.mealTargets?.dinner || 0) +
                                            (unit.mealTargets?.supper || 0)} refeições
                                    </span>
                                </div>

                                {/* Document Status or Map Button */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        {unit.sanitaryDocs && unit.sanitaryDocs.length > 0 && (
                                            <div className="flex items-center gap-1.5">
                                                <StatusIcon size={14} className={docStatus.color} />
                                                <span className={`text-xs ${docStatus.color} font-medium`}>
                                                    {docStatus.label}
                                                </span>
                                            </div>
                                        )}

                                        {(!unit.sanitaryDocs || unit.sanitaryDocs.length === 0) && (
                                            <div className="text-xs text-slate-400 italic">
                                                Documentos pendentes
                                            </div>
                                        )}
                                    </div>

                                    {/* Map Button */}
                                    {unit.address?.city && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                const address = `${unit.address.street || ''}, ${unit.address.number || 's/n'}, ${unit.address.neighborhood || ''}, ${unit.address.city} - ${unit.address.state}`;
                                                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                                                window.open(mapsUrl, '_blank');
                                            }}
                                            className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors flex items-center gap-1 border border-green-200"
                                        >
                                            <MapPin size={12} />
                                            Ver Rota
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {units.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Building2 size={64} className="mx-auto text-blue-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Bem-vindo ao Gestor de Unidades!</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        Cadastre sua primeira unidade para começar a gerenciar refeições, equipe e conformidade sanitária.
                    </p>
                    <button
                        onClick={handleCreateUnit}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={20} />
                        Cadastrar Primeira Unidade
                    </button>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <UnitFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUnit}
                    onDelete={handleDeleteUnit}
                    unit={selectedUnit}
                />
            )}
        </div>
    );
};

export default UnitsPage;
