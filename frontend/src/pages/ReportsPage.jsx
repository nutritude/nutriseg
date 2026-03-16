import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    DollarSign,
    Car,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Filter,
    FileImage,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import FinancialService from '../services/FinancialService';
import EmployeeService from '../services/EmployeeService';
import UnitService from '../services/UnitService';

const ReportsPage = () => {
    const [financials, setFinancials] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterUnit, setFilterUnit] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [finData, empData, unitData] = await Promise.all([
                FinancialService.getSummary(),
                EmployeeService.getAllEmployees(),
                UnitService.getUnits()
            ]);
            setFinancials(finData.logs || []);
            setEmployees(empData || []);
            setUnits(unitData.units || []);
        } catch (error) {
            console.error("Erro ao carregar relatórios:", error);
        } finally {
            setLoading(false);
        }
    };

    const getHealthColor = (status) => {
        if (status === 'Apto') return 'bg-green-100 text-green-700 border-green-200';
        if (status === 'Atenção') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 py-8"
        >
            {/* Header com Filtros */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BarChart3 size={36} className="text-blue-600" />
                        Relatórios e BI
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Auditando custos, pessoas e conformidade legal.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={filterUnit}
                            onChange={(e) => setFilterUnit(e.target.value)}
                            className="pl-10 pr-10 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer w-full"
                        >
                            <option value="all">Filtro por Unidade</option>
                            {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl">
                        <Download size={18} />
                        Exportar BI
                    </button>
                </div>
            </div>

            {/* Grid Financeiro & KM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Card Reembolsos Total */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden group">
                    <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                    <h3 className="text-blue-100 text-xs font-black uppercase tracking-widest mb-2">Reembolsos Pendentes</h3>
                    <div className="text-4xl font-black">R$ 1.240,50</div>
                    <div className="flex items-center gap-2 mt-4 text-blue-200 text-sm font-bold">
                        <ArrowUpRight size={16} className="text-green-400" />
                        <span>+12.5% vs mês anterior</span>
                    </div>
                </div>

                {/* Card KM Rodados */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="bg-orange-50 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-600 mb-6 font-black">
                        <Car size={24} />
                    </div>
                    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Quilometragem Auditada</h3>
                    <div className="text-3xl font-black text-slate-900">842 km</div>
                    <div className="flex items-center gap-2 mt-4 text-slate-500 text-sm font-bold">
                        <span>Rodados em visitas técnicas</span>
                    </div>
                </div>

                {/* Card Equipe Compliance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 mb-6 font-black">
                        <Users size={24} />
                    </div>
                    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Compliance de Equipe</h3>
                    <div className="text-3xl font-black text-slate-900">94%</div>
                    <div className="flex items-center gap-2 mt-4 text-emerald-500 text-sm font-bold">
                        <CheckCircle2 size={16} />
                        <span>Apto (ASO e Treinamentos)</span>
                    </div>
                </div>
            </div>

            {/* Seção Auditoria de Colaboradores */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 mb-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="text-blue-600" />
                        Auditoria de Saúde e Documentação
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Colaborador</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidade</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargo</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Venc. ASO</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Legal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {employees.map(emp => (
                                <tr key={emp._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 font-bold text-slate-900">{emp.name}</td>
                                    <td className="py-4 text-sm text-slate-500 font-medium">{emp.unitId || 'Todas'}</td>
                                    <td className="py-4 text-sm text-slate-500">{emp.role}</td>
                                    <td className="py-4 text-sm font-mono text-slate-600">
                                        {emp.health?.lastASO ? new Date(emp.health.lastASO).toLocaleDateString() : 'Pend'}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-tighter ${getHealthColor(emp.healthCompliance?.status)}`}>
                                            {emp.healthCompliance?.tag || '#sem_dados'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Galeria de Recibos Financeiros */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                    <FileImage size={200} />
                </div>

                <div className="flex justify-between items-center mb-10 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black">Galeria de Recibos</h2>
                        <p className="text-slate-400 font-medium">Comprovação fiscal de reembolsos e pedágios.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 relative z-10">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-square bg-slate-800 rounded-[2rem] border border-white/5 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center justify-center p-4">
                            <FileImage className="text-slate-600 group-hover:text-blue-400 transition-colors mb-2" size={32} />
                            <span className="text-[10px] font-black text-slate-500 uppercase">Recibo #{i}</span>
                            <div className="absolute inset-0 bg-blue-600/0 hover:bg-blue-600/10 transition-colors"></div>
                        </div>
                    ))}
                    <button className="aspect-square border-2 border-dashed border-slate-700 rounded-[2rem] flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-white transition-all group">
                        <Plus size={32} className="mb-2 group-hover:scale-125 transition-transform" />
                        <span className="text-[10px] font-black uppercase">Novo Recibo</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ReportsPage;
