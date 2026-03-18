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
    UserCircle,
    Thermometer,
    ChefHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportService from '../services/ReportService';
import UnitService from '../services/UnitService';
import PDFService from '../services/PDFService';
import { useUnit } from '../contexts/UnitContext';

const ReportsPage = () => {
    const { selectedUnit: activeUnit } = useUnit();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
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
        { id: 'requests', label: 'Solicitações', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'waste', label: 'Sobra Limpa', icon: Trash2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'employees', label: 'Funcionários', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'performance', label: 'Desempenho (BI)', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'temperatures', label: 'Termometria CVS', icon: Thermometer, color: 'text-cyan-500', bg: 'bg-cyan-50' },
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
                case 'temperatures':
                    res = await ReportService.getTemperaturesReport(params);
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

    const handleExport = async () => {
        if (!data || data.length === 0) {
            alert("Não há dados para exportar no momento.");
            return;
        }
        
        try {
            setExporting(true);
            const unitInfo = filters.unitId === 'all' ? null : units.find(u => u._id === filters.unitId);
            // Pequeno delay para garantir que o estado de loading apareça e não trave o thread instantaneamente
            await new Promise(resolve => setTimeout(resolve, 500));
            PDFService.generateGeneralReportPDF(data, activeTab, unitInfo);
        } catch (error) {
            console.error("Erro ao exportar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Verifique o console.");
        } finally {
            setExporting(false);
        }
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
                                    <td className="py-4 text-xs font-bold text-slate-500 text-right">{(item.produced || 0).toFixed(1)}</td>
                                    <td className="py-4 text-xs font-black text-emerald-600 text-right">{(item.sobraLimpa || 0).toFixed(1)}</td>
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
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Unidade & Cozinheiro(a)</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">Aceitabilidade (%)</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-right">Resto-Ingesta (kg)</th>
                                <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Pior Aceitação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="py-4">
                                        <p className="text-xs font-black text-slate-900">{item.meal}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{new Date(item.date).toLocaleDateString()}</p>
                                    </td>
                                    <td className="py-4">
                                        <p className="text-xs font-black text-slate-900">{units.find(u => u._id === item.unitId)?.name || item.unitId}</p>
                                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                            <ChefHat size={10} /> {item.cookOnDuty || 'Não Informado'}
                                        </p>
                                    </td>
                                    <td className="py-4 text-xs font-black text-blue-600 text-right">{(item.acceptability || 0).toFixed(1)}%</td>
                                    <td className="py-4 text-xs font-bold text-slate-900 text-right">
                                        {(item.restIngesta || 0).toFixed(1)} kg <br />
                                        <span className={`text-[9px] font-black ${(item.percentRest || 0) > 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ({(item.percentRest || 0).toFixed(1)}%)
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        {item.worstFood ? (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-red-600 uppercase break-words max-w-[120px]">{item.worstFood.name}</span>
                                                <span className="text-[9px] font-bold text-slate-500">{item.worstFood.kg} kg ({item.worstFood.type})</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-400">S/Registro</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case 'temperatures':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-2">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                                <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-600">
                                    <Thermometer size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Aferições Totais</p>
                                    <h4 className="text-2xl font-black text-slate-900">{data.length}</h4>
                                </div>
                            </div>
                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100/50 flex items-center gap-4">
                                <div className="bg-emerald-200/50 p-3 rounded-2xl text-emerald-600">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-emerald-600 tracking-widest">Conformidade</p>
                                    <h4 className="text-2xl font-black text-emerald-700">
                                        {data.length > 0 ? ((data.filter(d => d.isCompliant).length / data.length) * 100).toFixed(1) : 0}%
                                    </h4>
                                </div>
                            </div>
                            <div className="bg-red-50 p-6 rounded-3xl border border-red-100/50 flex items-center gap-4">
                                <div className="bg-red-200/50 p-3 rounded-2xl text-red-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-red-600 tracking-widest">Falhas Térmicas</p>
                                    <h4 className="text-2xl font-black text-red-700">{data.filter(d => !d.isCompliant).length}</h4>
                                </div>
                            </div>
                        </div>

                        {data.some(d => !d.isCompliant) && (
                            <div className="bg-red-600 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-lg relative overflow-hidden mb-8 mt-4">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle size={18} className="text-red-200 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ponto Crítico de Controle IDENTIFICADO</span>
                                    </div>
                                    <h4 className="text-xl font-black italic">Risco Biológico Detectado em {data.filter(d => !d.isCompliant).length} Itens</h4>
                                    <p className="text-[10px] font-bold text-red-100 uppercase mt-1">Gere o PDF para assinatura e tome as medidas corretivas registradas.</p>
                                </div>
                                <div className="absolute top-0 right-0 h-full w-1/2 opacity-20 pointer-events-none flex items-center justify-end pr-8">
                                    <Thermometer size={120} className="rotate-12 translate-x-12" />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-end px-2 mb-6 mt-8">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-1 px-1 bg-blue-600 rounded-full"></div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Listagem de Aferições Técnicas</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">{filters.unitId === 'all' ? 'Relatório Geral (Todas as Unidades)' : units.find(u => u._id === filters.unitId)?.name}</p>
                                </div>
                            </div>
                            {filters.unitId !== 'all' && (
                                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100/50">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-right">Responsável Técnico (RT)</p>
                                    <p className="text-[11px] font-black text-slate-900 italic text-right">{units.find(u => u._id === filters.unitId)?.rtNutritionist || '--'}</p>
                                </div>
                            )}
                        </div>

                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Data/Hora</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Unidade & Resp.</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Item</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Regime</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400 text-center">Auditoria</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-slate-400">Diagnóstico / Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.map((item, idx) => (
                                    <tr key={idx} className={`transition-colors ${item.isCompliant ? 'hover:bg-slate-50' : 'bg-red-50/20 hover:bg-red-50/40'}`}>
                                        <td className="py-4">
                                            <p className="text-xs font-bold text-slate-900">{new Date(item.date).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">{units.find(u => u._id === item.unitId)?.name || item.unitId}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                <UserCircle size={10} /> {units.find(u => u._id === item.unitId)?.rtNutritionist || 'A Definir (RT)'}
                                            </p>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-xs font-black text-slate-900">{item.item}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${item.regime === 'Quente' ? 'text-orange-600 bg-orange-100' : item.regime === 'Congelado' ? 'text-indigo-600 bg-indigo-100' : 'text-cyan-600 bg-cyan-100'}`}>
                                                {item.targetTemp}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-black ${item.isCompliant ? 'text-emerald-600' : 'text-red-600'}`}>{item.actualTemp}°C</span>
                                                <span className="text-[9px] text-slate-400 font-bold max-w-[80px] truncate" title={item.auditor}>
                                                    @{item.auditor}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            {item.isCompliant ? (
                                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> Conforme
                                                </span>
                                            ) : (
                                                <div className="text-[10px]">
                                                    <p className="font-black text-red-600 uppercase mb-0.5 tracking-wider">{item.deviationReason || 'Fora do Padrão'}</p>
                                                    {item.hasCorrectiveAction ? (
                                                        <p className="font-bold text-slate-600 italic">Resp: {item.correctiveAction}</p>
                                                    ) : (
                                                        <p className="font-bold text-red-400 uppercase">⚠️ Pendente de Ação</p>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                    <button 
                        onClick={handleExport} 
                        disabled={exporting}
                        className={`${exporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'} text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center gap-2`}
                    >
                        {exporting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Download size={18} />
                        )}
                        {exporting ? 'Gerando Documento...' : 'Exportar Relatório'}
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

                        {filters.unitId !== 'all' && (
                            <div className="mb-10 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between animate-fade-in shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-600 border border-slate-100">
                                        <UserCircle size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Responsável Técnico (RT) / Gerente</p>
                                        <h4 className="text-lg font-black text-slate-900 italic tracking-tight">
                                            {units.find(u => u._id === filters.unitId)?.rtNutritionist || 'Pendente de Atribuição no Cadastro'}
                                        </h4>
                                    </div>
                                </div>
                                <div className="text-right border-l pl-8 border-slate-200">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Identificação da Unidade</p>
                                    <p className="text-sm font-black text-blue-600 uppercase italic tracking-tighter">
                                        {units.find(u => u._id === filters.unitId)?.name}
                                    </p>
                                </div>
                            </div>
                        )}

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
