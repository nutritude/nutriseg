import React, { useState, useEffect } from 'react';
import { Users, Plus, AlertTriangle, CheckCircle, Calendar, Building2, EyeOff, RotateCcw, Zap } from 'lucide-react';
import EmployeeService from '../services/EmployeeService';
import UnitService from '../services/UnitService';
import EmployeeFormModal from '../components/EmployeeFormModal';

const TeamPage = () => {
    const [employees, setEmployees] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [showInactive, setShowInactive] = useState(true); // mostra inativos por padrão
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        loadUnits();
    }, []);

    useEffect(() => {
        loadEmployees();
    }, [selectedUnit]);

    const loadUnits = async () => {
        try {
            const data = await UnitService.getUnits();
            setUnits(data.units || []);
        } catch (error) {
            console.error('Error loading units:', error);
        }
    };

    const loadEmployees = async () => {
        try {
            setLoading(true);
            // Carrega TODOS (ativos e inativos): pass null = sem filtro de active
            if (selectedUnit === 'all') {
                const data = await EmployeeService.getAllEmployees(null);
                setEmployees(data.employees || []);
            } else {
                const data = await EmployeeService.getEmployeesByUnit(selectedUnit, null);
                setEmployees(data.employees || []);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEmployee = () => {
        setSelectedEmployee(null);
        setIsModalOpen(true);
    };

    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleSaveEmployee = async (employeeData) => {
        try {
            if (selectedEmployee) {
                await EmployeeService.updateEmployee(selectedEmployee._id, employeeData);
            } else {
                await EmployeeService.createEmployee(employeeData);
            }
            setIsModalOpen(false);
            loadEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            throw error;
        }
    };

    // Quando desativado/excluído: recarrega a lista (mantém inativos visíveis)
    const handleDeleteEmployee = (deletedId) => {
        setIsModalOpen(false);
        loadEmployees(); // recarrega para refletir o novo status
    };

    const handleReactivateEmployee = async (e, employee) => {
        e.stopPropagation();
        try {
            // Optimistic update: atualiza a UI imediatamente para parecer instantâneo
            setEmployees(prev => prev.map(emp =>
                emp._id === employee._id
                    ? { ...emp, active: true, inactiveReason: null, inactiveSince: null }
                    : emp
            ));

            // Chama API em background
            await EmployeeService.reactivateEmployee(employee._id);

            // Recarrega silenciosamente para garantir consistência
            loadEmployees();
        } catch (error) {
            console.error('Erro ao reativar:', error);
            // Em caso de erro, recarrega para desfazer a alteração otimista
            loadEmployees();
            alert('Não foi possível reativar o colaborador.');
        }
    };

    const getHealthStatusBadge = (employee) => {
        // Inativos têm badge próprio baseado no motivo
        if (employee.active === false) {
            const reason = employee.inactiveReason || 'Outros';
            const reasonMap = {
                'Afastado': {
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: '🏥',
                    label: 'Afastado',
                },
                'Férias': {
                    color: 'bg-teal-100 text-teal-700 border-teal-200',
                    icon: '🏖️',
                    label: 'Férias',
                },
                'Outros': {
                    color: 'bg-slate-100 text-slate-500 border-slate-200',
                    icon: '📌',
                    label: 'Afastado',
                },
            };
            const mapped = reasonMap[reason] || reasonMap['Outros'];
            return {
                ...mapped,
                textIcon: mapped.icon, // emoji, não componente
                alert: false,
                inactive: true,
            };
        }

        const status = employee.healthStatus;
        const expiringExams = employee.examsExpiringWithin30Days || [];

        if (status === 'Inapto') {
            return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'Inapto', alert: true, inactive: false };
        }
        if (expiringExams.length > 0) {
            return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle, label: 'Vencendo', alert: true, inactive: false };
        }
        return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Apto', alert: false, inactive: false };
    };

    // Filtra a lista de acordo com toggle
    const filteredEmployees = showInactive
        ? employees
        : employees.filter(e => e.active !== false);

    const activeCount = employees.filter(e => e.active !== false).length;
    const inactiveCount = employees.filter(e => e.active === false).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-slate-500">
                    <div className="h-5 w-5 border-2 border-blue-400 border-t-transparent animate-spin rounded-full" />
                    Carregando colaboradores...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-blue-600" />
                        Gestão de Equipe
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{activeCount}</span> ativo{activeCount !== 1 ? 's' : ''}
                        {inactiveCount > 0 && (
                            <span className="ml-2 text-slate-400">
                                · <span className="font-semibold text-slate-500">{inactiveCount}</span> afastado{inactiveCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {/* Filtro de unidade */}
                    <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="flex-1 md:flex-none px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas as Unidades</option>
                        {units.map(unit => (
                            <option key={unit._id} value={unit._id}>{unit.name}</option>
                        ))}
                    </select>

                    {/* Toggle mostrar/ocultar inativos */}
                    {inactiveCount > 0 && (
                        <button
                            onClick={() => setShowInactive(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${showInactive
                                ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                }`}
                            title={showInactive ? 'Ocultar afastados' : 'Mostrar afastados'}
                        >
                            <EyeOff size={14} />
                            {showInactive ? `Ocultar afastados (${inactiveCount})` : `Mostrar afastados (${inactiveCount})`}
                        </button>
                    )}

                    <button
                        onClick={handleCreateEmployee}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Novo Colaborador
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {filteredEmployees.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Users size={64} className="mx-auto text-blue-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {employees.length === 0 ? 'Nenhum colaborador cadastrado' : 'Nenhum colaborador ativo'}
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        {employees.length === 0
                            ? 'Cadastre colaboradores para gerenciar exames de saúde e conformidade sanitária.'
                            : `Todos os ${inactiveCount} colaborador${inactiveCount !== 1 ? 'es estão' : ' está'} afastado${inactiveCount !== 1 ? 's' : ''}. Clique em "Mostrar afastados" para visualizá-los.`
                        }
                    </p>
                    {employees.length === 0 && (
                        <button
                            onClick={handleCreateEmployee}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <Plus size={20} />
                            Cadastrar Primeiro Colaborador
                        </button>
                    )}
                </div>
            )}

            {/* Employees Table */}
            {filteredEmployees.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase">Nome</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase hidden md:table-cell">Função</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase hidden lg:table-cell">Unidade</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase hidden lg:table-cell">Vínculo</th>
                                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-600 uppercase">Status</th>
                                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-600 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.map(employee => {
                                    const healthBadge = getHealthStatusBadge(employee);
                                    const StatusIcon = healthBadge.icon;
                                    const isInactive = employee.active === false;

                                    return (
                                        <tr
                                            key={employee._id}
                                            className={`transition-colors ${isInactive
                                                ? 'bg-slate-50/60 hover:bg-slate-100/60'
                                                : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className={`font-medium flex items-center gap-2 ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                    {isInactive && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500"
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            {employee.inactiveReason === 'Afastado' && '🏥'}
                                                            {employee.inactiveReason === 'Férias' && '🏖️'}
                                                            {(!employee.inactiveReason || employee.inactiveReason === 'Outros') && '📌'}
                                                            {employee.inactiveReason || 'AFASTADO'}
                                                        </span>
                                                    )}
                                                    <span>{employee.name}</span>
                                                </div>
                                                <div className={`text-xs md:hidden mt-0.5 ${isInactive ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {employee.role}
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3 hidden md:table-cell ${isInactive ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {employee.role}
                                            </td>
                                            <td className={`px-4 py-3 hidden lg:table-cell ${isInactive ? 'text-slate-400' : 'text-slate-600'}`}>
                                                <div className="flex items-center gap-1">
                                                    <Building2 size={14} className={isInactive ? 'text-slate-300' : 'text-slate-400'} />
                                                    {employee.unitId?.name || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className={`text-xs px-2 py-1 rounded-full ${isInactive ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-700'}`}>
                                                    {employee.employmentType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    {healthBadge.inactive ? (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${healthBadge.color}`}>
                                                            <span>{healthBadge.textIcon}</span>
                                                            {healthBadge.label}
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${healthBadge.color}`}>
                                                            {healthBadge.icon && <healthBadge.icon size={12} />}
                                                            {healthBadge.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    {isInactive ? (
                                                        <button
                                                            onClick={(e) => handleReactivateEmployee(e, employee)}
                                                            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-2 py-1 rounded border border-teal-200 hover:bg-teal-100 transition-all shadow-sm"
                                                            title="Reativar colaborador instantaneamente"
                                                        >
                                                            <Zap size={12} className="fill-teal-600" />
                                                            Reativar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEditEmployee(employee)}
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                                        >
                                                            Editar
                                                        </button>
                                                    )}
                                                    {!isInactive && healthBadge.alert && (
                                                        <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            Agendar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Legenda rodapé */}
                    {inactiveCount > 0 && showInactive && (
                        <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 flex items-center gap-2 text-xs text-slate-500">
                            <EyeOff size={12} />
                            <span>Colaboradores com fundo cinza e nome tachado estão afastados (férias, licença médica, etc). Clique em "Reativar" para restabelecer o acesso.</span>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <EmployeeFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveEmployee}
                    onDelete={handleDeleteEmployee}
                    employee={selectedEmployee}
                    units={units}
                />
            )}
        </div>
    );
};

export default TeamPage;
