import React, { useState, useEffect } from 'react';
import {
    Utensils,
    Trash2,
    Thermometer,
    Star,
    AlertTriangle,
    Clock,
    FileText,
    Filter,
    ShieldCheck,
    TrendingUp,
    Users,
    CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import UnitService from '../services/UnitService';
import DashboardService from '../services/DashboardService';
import { useUnit } from '../contexts/UnitContext';

// Novos componentes de Dashboard
import SanitaryRadar from '../components/dashboard/SanitaryRadar';
import CriticalTemperatureCard from '../components/dashboard/CriticalTemperatureCard';
import WasteStackedBar from '../components/dashboard/WasteStackedBar';
import ComplianceHeatmap from '../components/dashboard/ComplianceHeatmap';

const Home = () => {
    const { selectedUnit: activeUnit, selectUnit } = useUnit();
    const [units, setUnits] = useState([]);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUnits();
    }, []);

    useEffect(() => {
        fetchKpis();
    }, [activeUnit]);

    const loadUnits = async () => {
        try {
            const data = await UnitService.getUnits();
            setUnits(data.units || []);
        } catch (error) {
            console.error('Error loading units:', error);
        }
    };

    const fetchKpis = async () => {
        try {
            setLoading(true);
            const data = await DashboardService.getKpis(activeUnit?._id || 'all');
            setKpis(data);
        } catch (error) {
            console.error('Error fetching KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            {/* Header Estratégico */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Dashboard de Auditoria UAN
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium">
                        <ShieldCheck size={18} className="text-green-500" />
                        <span>Compliance CVS 5/2013 & RDC 216</span>
                        <span className="mx-2">•</span>
                        <Clock size={16} />
                        <span>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
                        <select
                            value={activeUnit?._id || 'all'}
                            onChange={(e) => {
                                const unitId = e.target.value;
                                if (unitId === 'all') selectUnit(null);
                                else selectUnit(units.find(u => u._id === unitId));
                            }}
                            className="pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:border-blue-300 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all cursor-pointer appearance-none shadow-sm min-w-[200px]"
                        >
                            <option value="all">Filtro Global</option>
                            {units.map(unit => (
                                <option key={unit._id} value={unit._id}>{unit.name}</option>
                            ))}
                        </select>
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                        <TrendingUp size={18} />
                        Gerar Relatório Técnico
                    </button>
                </div>
            </div>

            {/* Passo 1: Alertas Críticos (Zona de Perigo) */}
            {kpis?.critical && <CriticalTemperatureCard criticalData={kpis.critical} />}

            {/* Passo 2: KPIs Principais (Micro-Cards Animados) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* KPI Aceitabilidade */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full translate-x-8 -translate-y-8 opacity-50 group-hover:scale-110 transition-transform"></div>
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Aceitabilidade</h4>
                    <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-slate-800">{kpis?.meals?.acceptability?.toFixed(1)}%</div>
                        {kpis?.meals?.acceptability < 85 && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-lg font-bold">#alerta</span>
                        )}
                    </div>
                    <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${kpis?.meals?.acceptability || 0}%` }}
                            className={`h-full ${kpis?.meals?.acceptability >= 85 ? 'bg-green-500' : 'bg-orange-500'}`}
                        ></motion.div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 font-medium">Meta Auditada: &gt; 85%</p>
                </div>

                {/* KPI Resto-Ingesta */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Resto-Ingesta</h4>
                    <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-slate-800">{kpis?.waste?.percent}%</div>
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${kpis?.waste?.percent > 3 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {kpis?.waste?.percent > 3 ? '#atencao' : '#conforme'}
                        </span>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 font-medium">Total: {kpis?.waste?.totalKg} kg coletados</p>
                </div>

                {/* KPI Documentação */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Documentação</h4>
                    <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-slate-800">{kpis?.docs?.complianceRate || 0}%</div>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg font-bold">Auditoria</span>
                    </div>
                    <p className={`mt-4 text-xs font-medium ${kpis?.docs?.expired > 0 ? 'text-red-500 font-mono' : 'text-slate-500'}`}>
                        {kpis?.docs?.expired || 0} Documentos Vencidos
                    </p>
                </div>

                {/* KPI Saúde RH */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Saúde Ocupacional</h4>
                    <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-slate-800">{kpis?.health?.complianceRate || 0}%</div>
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${kpis?.health?.complianceRate >= 90 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            ASO em Dia
                        </span>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 font-medium">
                        {kpis?.health?.expiringSoon || 0} Exames nos próximos 15 dias
                    </p>
                </div>
            </div>

            {/* Passo 3: Gráficos Avançados (Radar & Heatmap) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <SanitaryRadar data={kpis?.radar || {}} />
                <ComplianceHeatmap units={kpis?.heatmap || []} />
            </div>

            {/* Passo 4: Operacional & Desperdício */}
            <div className="grid grid-cols-1 gap-8 mb-8">
                <WasteStackedBar data={[
                    { name: 'Unidade Sumaré', produzido: 450, sobra: 30, resto: 12 },
                    { name: 'Unidade Campinas', produzido: 800, sobra: 45, resto: 25 },
                    { name: 'Unidade Hortolândia', produzido: 300, sobra: 10, resto: 8 },
                ]} />
            </div>

            {/* Passo 5: Monitoramento de Ações Corretivas (RH Inaptos) */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="text-blue-600" />
                        Ações Corretivas Pendentes (Saúde)
                    </h2>
                    <Link to="/equipe" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                        Gerenciar Equipe &rarr;
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(!kpis?.correctiveActions || kpis.correctiveActions.length === 0) ? (
                        <div className="col-span-full py-10 text-center bg-green-50/50 rounded-3xl border border-green-100 flex flex-col items-center">
                            <CheckCircle className="text-green-500 mb-3" size={32} />
                            <p className="text-sm font-bold text-green-800">Toda a equipe está Apta ou com ações em dia!</p>
                        </div>
                    ) : (
                        kpis.correctiveActions.map(action => (
                            <div key={action.id} className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-1 pt-full bg-orange-500 h-full"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-black">
                                        {action.employeeName.charAt(0)}
                                    </div>
                                    <span className="text-[9px] font-black uppercase bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">#inapto</span>
                                </div>
                                <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{action.employeeName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{action.role} • {action.unitName}</p>
                                
                                <div className="space-y-2">
                                    {action.actions.training && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-orange-50/50 p-2 rounded-lg">
                                            <ShieldCheck size={14} /> Treinamento Solicitado
                                        </div>
                                    )}
                                    {action.actions.medicalExams && (
                                        <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50/50 p-2 rounded-lg">
                                            <Thermometer size={14} /> Exame Médico Pendente
                                        </div>
                                    )}
                                    {action.actions.others && (
                                        <div className="flex items-start gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <Info size={14} className="shrink-0 mt-0.5" />
                                            <span className="italic">"{action.actions.others}"</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Passo 6: Feeds de Auditoria */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <AlertTriangle className="text-orange-500" />
                        Log de Não-Conformidades
                    </h2>
                    <Link to="/checklist" className="text-sm font-bold text-blue-600 hover:text-blue-500 transition-colors uppercase tracking-wider">
                        Ver Auditoria Completa &rarr;
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kpis?.feeds?.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Star className="mx-auto text-yellow-400 mb-4" size={48} />
                            <p className="text-xl font-bold text-slate-900">100% Compliance!</p>
                            <p className="text-slate-500">Nenhuma não-conformidade registrada hoje.</p>
                        </div>
                    ) : (
                        kpis?.feeds?.map(feed => (
                            <div key={feed.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all border-l-4 border-l-red-500">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded">#critico</span>
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                        <Clock size={10} /> {feed.date}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-900 mb-1">{feed.title}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{feed.msg}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Home;
