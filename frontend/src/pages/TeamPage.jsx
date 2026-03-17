import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, AlertTriangle, CheckCircle, Calendar, Building2, EyeOff, Zap, Search, Filter, Info, RefreshCcw } from 'lucide-react';
import EmployeeService from '../services/EmployeeService';
import UnitService from '../services/UnitService';
import EmployeeFormModal from '../components/EmployeeFormModal';
import { motion, AnimatePresence } from 'framer-motion';

const TeamPage = () => {
    const [employees, setEmployees] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [showInactive, setShowInactive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Evita race conditions em requisições async
    const fetchIdRef = useRef(0);

    const loadUnits = useCallback(async () => {
        try {
            const data = await UnitService.getUnits();
            setUnits(data.units || []);
        } catch (error) {
            console.error('[TeamPage] Erro ao carregar unidades:', error);
        }
    }, []);

    const loadEmployees = useCallback(async (isInitial = false) => {
        const currentFetchId = ++fetchIdRef.current;
        
        try {
            if (isInitial) setLoading(true);
            setRefreshing(true);
            
            console.log(`[TeamPage] Buscando funcionários (Unit: ${selectedUnit})...`);
            
            let data;
            // Busca todos se for 'all' ou se por algum motivo a unidade estiver nula no contexto
            if (selectedUnit === 'all' || !selectedUnit) {
                data = await EmployeeService.getAllEmployees(null);
            } else {
                data = await EmployeeService.getEmployeesByUnit(selectedUnit, null);
            }
            
            // Só atualiza o estado se esta for a última requisição disparada
            if (currentFetchId === fetchIdRef.current) {
                console.log(`[TeamPage] Sucesso: ${data.employees?.length || 0} encontrados.`);
                setEmployees(data.employees || []);
            }
        } catch (error) {
            console.error('[TeamPage] Erro crítico ao carregar funcionários:', error);
            // Em caso de erro, só limpa se for a carga inicial ou se o erro for persistente
            if (currentFetchId === fetchIdRef.current && isInitial) {
                setEmployees([]);
            }
        } finally {
            if (currentFetchId === fetchIdRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [selectedUnit]);

    useEffect(() => {
        loadUnits();
        loadEmployees(true);
    }, [loadUnits]); // Carrega inicial

    useEffect(() => {
        // Recarrega sempre que a unidade selecionada mudar
        loadEmployees(false);
    }, [selectedUnit, loadEmployees]);

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
            loadEmployees(false);
        } catch (error) {
            console.error('Error saving employee:', error);
            throw error;
        }
    };

    const handleReactivateEmployee = async (e, employee) => {
        e.stopPropagation();
        try {
            await EmployeeService.reactivateEmployee(employee._id);
            loadEmployees(false);
        } catch (error) {
            console.error('Erro ao reativar:', error);
            alert('Erro ao reativar colaborador.');
        }
    };

    const getStatusConfig = (employee) => {
        if (employee.active === false) {
            return { label: employee.inactiveReason || 'Inativo', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Info };
        }
        const status = employee.healthCompliance?.status || 'Sem Dados';
        switch (status) {
            case 'Inapto': return { label: 'Inapto', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle };
            case 'Atenção': return { label: 'Vencendo', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
            case 'Apto': return { label: 'Conforme', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
            case 'Apto (Geral)': return { label: 'Apto Geral', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: CheckCircle };
            default: return { label: 'Pendente', color: 'bg-slate-50 text-slate-400 border-slate-100', icon: Info };
        }
    };

    const filteredEmployees = employees
        .filter(e => showInactive || e.active !== false)
        .filter(e => {
            if (!searchTerm) return true;
            const s = searchTerm.toLowerCase();
            return e.name.toLowerCase().includes(s) || (e.role || '').toLowerCase().includes(s) || (e.cpf || '').includes(s);
        });

    return (
        <div className="w-full space-y-6">
            {/* Top Info Bar (Indica sync em background sem sumir com os dados) */}
            <AnimatePresence>
                {refreshing && !loading && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-blue-600/10 text-blue-700 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-200">
                            <RefreshCcw size={12} className="animate-spin" />
                            Sincronizando dados em tempo real...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users size={32} className="text-blue-600" />
                        Equipe e RH
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gestão de conformidade e prontuários.</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, cargo ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleCreateEmployee}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Novo Cadastro
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block tracking-widest italic">Filtrar Unidade</label>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                        >
                            <option value="all">Todas as Unidades</option>
                            {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="md:col-span-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-8 overflow-x-auto">
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                            showInactive ? 'bg-slate-950 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {showInactive ? 'Ocultar Afastados' : 'Mostrar Afastados'}
                    </button>
                    
                    <div className="h-10 w-px bg-slate-100 shrink-0" />
                    
                    <div className="flex gap-8">
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Membros</span>
                            <span className="text-xl font-black text-slate-900">{employees.length}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendências</span>
                            <span className="text-xl font-black text-red-500">
                                {employees.filter(e => e.healthCompliance?.status === 'Inapto' || e.healthCompliance?.status === 'Atenção').length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Colaborador</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargo / Vínculo</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade Alocada</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 relative">
                            {/* Loading Inicial (Sumiço evitado) */}
                            {loading && employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">Iniciando conexão segura...</p>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum registro ativo para este filtro.</td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => {
                                    const status = getStatusConfig(employee);
                                    const StatusIcon = status.icon;
                                    const unitName = typeof employee.unitId === 'object' ? employee.unitId?.name : (units.find(u => u._id === employee.unitId)?.name || '---');

                                    return (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1, filter: refreshing ? 'blur(1px)' : 'none' }}
                                            key={employee._id}
                                            onClick={() => handleEditEmployee(employee)}
                                            className={`hover:bg-blue-50/40 transition-all cursor-pointer group ${!employee.active ? 'bg-slate-50/50' : ''}`}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${!employee.active ? 'bg-slate-300' : 'bg-blue-600 shadow-blue-200'}`}>
                                                        {employee.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`font-black text-sm leading-tight ${!employee.active ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-blue-600 transition-colors'}`}>
                                                            {employee.name}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">ID: {...(employee._id || '').slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-700">{employee.role || 'Geral'}</p>
                                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[9px] font-black uppercase text-slate-400 border border-slate-200">
                                                        {employee.employmentType || 'CLT'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Building2 size={16} className="text-blue-500 shrink-0" />
                                                    <p className="text-sm font-bold truncate max-w-[200px]">{unitName}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 transition-all ${status.color}`}>
                                                        <StatusIcon size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{status.label}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-300 group-hover:text-blue-600 transition-all">
                                                {!employee.active ? (
                                                    <button onClick={(e) => handleReactivateEmployee(e, employee)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-all" title="Reativar"><Zap size={18} fill="currentColor" /></button>
                                                ) : '→'}
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <EmployeeFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveEmployee}
                    onDelete={() => { setIsModalOpen(false); loadEmployees(false); }}
                    employee={selectedEmployee}
                    units={units}
                />
            )}
        </div>
    );
};

export default TeamPage;
