import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    FileText,
    Users,
    Trash2,
    CheckCircle2,
    Calendar,
    Download,
    Filter,
    Search,
    ChevronRight,
    ClipboardList,
    TrendingUp,
    AlertTriangle,
    Clock,
    UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportService from '../services/ReportService';
import UnitService from '../services/UnitService';
import { useUnit } from '../contexts/UnitContext';

const ReportsPage = () => {
    const { selectedUnit: activeUnit } = useUnit();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('non-conformities');
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        unitId: activeUnit?._id || 'all',
        period: 'monthly',
        startDate: '',
        endDate: '',
        status: 'all',
        role: 'all'
    });

    const tabs = [
        { id: 'non-conformities', label: 'Não-Conformidades', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
        { id: 'requests', label: 'Solicitações', icon: FileText, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'waste', label: 'Sobra Limpa', icon: Trash2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'employees', label: 'Funcionários', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'performance', label: 'Desempenho (BI)', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    useEffect(() => {
        loadUnits();
    }, []);

    useEffect(() => {
        loadReportData();
    }, [activeTab, filters, activeUnit]);

    const loadUnits = async () => {
        try {
            const res = await UnitService.getUnits();
            setUnits(res.units || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadReportData = async () => {
        try {
            setLoading(true);
            const params = { ...filters };
            if (activeUnit?._id) params.unitId = activeUnit._id;
            
            let res = [];
            switch (activeTab) {
                case 'non-conformities':
                    res = await ReportService.getNonConformities(params);
                    break;
                case 'requests':
                    res = await ReportService.getRequests(params);
                    break;
                case 'waste':
                    res = await ReportService.getWasteReport(params);
                    break;
                case 'employees':
                    res = await ReportService.getEmployeesReport(params);
                    break;
                case 'performance':
                    res = await ReportService.getPerformanceReport(params);
                    break;
                default:
                    res = [];
            }
            setData(res);
        } catch (error) {
            console.error("Erro ao carregar relatório:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Mock export
        alert("Exportando relatório para Excel/PDF...");
    };

    const renderTable = () => {
        if (loading) return (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Processando Dados...</p>
            </div>
        );

        if (data.length === 0) return (
            <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-xl font-bold text-slate-900">Nenhum registro encontrado</p>
                <p className="text-slate-500">Tente ajustar os filtros de data ou unidade.</p>
            </div>
        );

        switch (activeTab) {
            case 'non-conformities':
                return (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Data</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Unit ID</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Inconformidade</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Observação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                                    <td className="py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="py-4 text-xs font-black text-slate-900">{units.find(u => u._id === item.unitId)?.name || item.unitId}</td>
                                    <td className="py-4 text-xs font-bold text-red-600">{item.question}</td>
                                    <td className="py-4 text-xs text-slate-500 italic">"{item.comment}"</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'requests':
                return (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Data</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Título</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Prioridade</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="py-4 text-xs font-black text-slate-900">{item.title}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${item.priority === 'Critico' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="py-4 text-xs text-slate-500 font-bold uppercase">{item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'waste':
                return (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Data</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Refeição</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">Produzido (kg)</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">Sobra Limpa (kg)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="py-4 text-xs font-black text-slate-900">{item.meal}</td>
                                    <td className="py-4 text-xs font-bold text-slate-500 text-right">{item.produced.toFixed(1)}</td>
                                    <td className="py-4 text-xs font-black text-emerald-600 text-right">{item.sobraLimpa.toFixed(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'employees':
                return (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Nome</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Cargo</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Status</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Saúde</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="py-4 text-xs font-black text-slate-900">{item.name}</td>
                                    <td className="py-4 text-xs font-bold text-slate-500">{item.role}</td>
                                    <td className="py-4">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black text-slate-600 uppercase">
                                            {item.status || 'Ativo'}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.healthCompliance?.color === 'green' ? 'text-emerald-600 bg-emerald-100' : 'text-red-600 bg-red-100'}`}>
                                            {item.healthCompliance?.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'performance':
                return (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Data / Refeição</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">Aceitabilidade (%)</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">Resto-Ingesta (kg)</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">% Perda</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="py-4">
                                        <p className="text-xs font-black text-slate-900">{item.meal}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{new Date(item.date).toLocaleDateString()}</p>
                                    </td>
                                    <td className="py-4 text-xs font-black text-blue-600 text-right">{item.acceptability.toFixed(1)}%</td>
                                    <td className="py-4 text-xs font-bold text-slate-900 text-right">{item.restIngesta.toFixed(1)} kg</td>
                                    <td className="py-4 text-right">
                                        <span className={`text-xs font-black ${item.percentRest > 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {item.percentRest.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full pb-20">
            {/* Header com BI Visual */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 italic">
                        <BarChart3 size={40} className="text-blue-600" />
                        Relatórios Analíticos
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
                        Extração Segura de Dados e Inteligência Operacional
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button onClick={handleExport} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-2">
                        <Download size={18} />
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* Controle de Filtros Premium */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-12 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Unidade</label>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select
                            value={filters.unitId}
                            onChange={(e) => setFilters({ ...filters, unitId: e.target.value })}
                            className="w-full pl-10 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none"
                        >
                            <option value="all">Todas as Unidades</option>
                            {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Período</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select
                            value={filters.period}
                            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                            className="w-full pl-10 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none"
                        >
                            <option value="daily">Hoje</option>
                            <option value="weekly">Últimos 7 dias</option>
                            <option value="monthly">Últimos 30 dias</option>
                            <option value="custom">Data Personalizada</option>
                        </select>
                    </div>
                </div>

                {filters.period === 'custom' && (
                    <>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Início</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Fim</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none"
                            />
                        </div>
                    </>
                )}

                {activeTab === 'employees' && (
                    <>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            >
                                <option value="all">Todos Status</option>
                                <option value="Ativo">Ativo</option>
                                <option value="Férias">Férias</option>
                                <option value="Afastado">Afastado</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Cargo</label>
                            <input
                                type="text"
                                placeholder="Filtrar Cargo..."
                                value={filters.role}
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Abas e Listagem */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Lateral: Seleção de Relatório */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Categorias</h3>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all group ${
                                activeTab === tab.id 
                                ? 'bg-slate-900 text-white shadow-xl translate-x-3' 
                                : 'bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                        >
                            <div className={`p-2 rounded-xl ${activeTab === tab.id ? 'bg-white/10' : tab.bg}`}>
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : tab.color} />
                            </div>
                            <span className="text-sm font-black italic">{tab.label}</span>
                            <ChevronRight size={16} className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === tab.id ? 'opacity-100' : ''}`} />
                        </button>
                    ))}
                    
                    <div className="mt-10 p-6 bg-blue-600 rounded-[2.5rem] text-white">
                        <TrendingUp size={24} className="mb-4" />
                        <h4 className="font-black italic text-lg leading-tight mb-2">Poder de Decisão em Tempo Real</h4>
                        <p className="text-[10px] font-bold text-blue-100 uppercase leading-relaxed">Cruzamento de dados entre unidades para otimização de custos e processos.</p>
                    </div>
                </div>

                {/* Conteúdo: Tabela e Visualização */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 min-h-[600px]">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 italic">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h2>
                                <p className="text-slate-400 text-xs font-bold mt-1">
                                    Exibindo {data.length} registros no período selecionado.
                                </p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-2xl flex items-center gap-2 border border-slate-100">
                                <Search size={16} className="text-slate-400 ml-2" />
                                <input 
                                    type="text" 
                                    placeholder="Burcar no relatório..." 
                                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 w-48"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {renderTable()}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ReportsPage;
