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
    CheckCircle,
    Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UnitService from '../services/UnitService';
import DashboardService from '../services/DashboardService';
import { useUnit } from '../contexts/UnitContext';

// Novos componentes de Dashboard
import SanitaryRadar from '../components/dashboard/SanitaryRadar';
import CriticalTemperatureCard from '../components/dashboard/CriticalTemperatureCard';
import WasteStackedBar from '../components/dashboard/WasteStackedBar';
import StructuralAnalysis from '../components/dashboard/StructuralAnalysis';
import HRAnalytics from '../components/dashboard/HRAnalytics';
import SituationalRisk from '../components/dashboard/SituationalRisk';

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

            {/* Passo 2: Business Intelligence & KPIs Estratégicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                {/* KPI Lucratividade / Perda (Novo) */}
                <div className="bg-slate-950 p-6 rounded-3xl shadow-2xl relative overflow-hidden group border border-slate-800">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp size={80} className="text-blue-400" />
                    </div>
                    <h4 className="text-blue-400/60 text-[10px] font-black uppercase tracking-widest mb-1 italic">Inteligência Financeira</h4>
                    <p className="text-white text-xs font-bold mb-4 opacity-70">Impacto Mensal Estimado</p>
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-white italic">-{kpis?.financial?.currency} {kpis?.financial?.estimatedLoss || '0,00'}</div>
                        <p className="text-[10px] text-red-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                            <AlertTriangle size={12} /> Desperdício acumulado
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-400">
                            <span>Eficiência: {kpis?.financial?.wasteEfficiency || 0}%</span>
                            <span className="text-green-400">Recuperável: {kpis?.financial?.currency} {kpis?.financial?.potentialSavings}</span>
                        </div>
                    </div>
                </div>

                {/* KPI Aceitabilidade */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Star size={100} className="text-amber-500" />
                    </div>
                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Satisfação / Meta</h4>
                    <div className="flex items-end gap-2">
                        <div className="text-4xl font-black text-slate-800">{Math.round(kpis?.meals?.acceptability || 0)}%</div>
                        <div className="mb-1 text-xs font-bold text-slate-400">meta: 85%</div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${kpis?.meals?.acceptability || 0}%` }}
                                className={`h-full ${kpis?.meals?.acceptability >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            />
                        </div>
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">Total Servido: {(kpis?.meals?.served || 0).toLocaleString()} refeições</p>
                </div>

                {/* KPI Documentação */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Doc. Sanitária</h4>
                    <div className="flex items-center gap-3">
                        <div className="text-4xl font-black text-slate-800">{kpis?.docs?.complianceRate || 0}%</div>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg font-black uppercase tracking-tighter italic">Auditoria</span>
                    </div>
                    
                    {kpis?.docs?.units?.length > 0 ? (
                        <div className="mt-4 space-y-2">
                            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Unidades com Pendência:</p>
                            <div className="flex flex-wrap gap-1">
                                {kpis.docs.units.slice(0, 3).map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            const unit = units.find(unit => unit._id === u.id);
                                            if (unit) selectUnit(unit);
                                        }}
                                        className="text-[9px] font-black text-red-600 hover:scale-105 active:scale-95 flex items-center gap-1 bg-red-50 border border-red-100 px-2 py-1 rounded-lg transition-all"
                                    >
                                        {u.name} &rarr;
                                    </button>
                                ))}
                            </div>
                            <Link to="/unidades" className="mt-2 block text-[9px] font-black text-blue-600 hover:underline uppercase tracking-widest italic animate-pulse">
                                #regularizar_docs &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-4 flex items-center gap-2 text-emerald-600">
                             <CheckCircle size={14} />
                             <p className="text-[10px] font-black uppercase tracking-widest">Compliance OK</p>
                        </div>
                    )}
                </div>

                {/* KPI Saúde RH */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Saúde (ASO)</h4>
                    <div className="flex items-center gap-3">
                        <div className="text-4xl font-black text-slate-800">{kpis?.health?.complianceRate || 0}%</div>
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter italic ${kpis?.health?.complianceRate >= 90 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                            Em Dia
                        </span>
                    </div>

                    {kpis?.health?.units?.length > 0 ? (
                        <div className="mt-4 space-y-2">
                            <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Regiões em Atenção:</p>
                            <div className="flex flex-wrap gap-1">
                                {kpis.health.units.slice(0, 3).map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            const unit = units.find(unit => unit._id === u.id);
                                            if (unit) selectUnit(unit);
                                        }}
                                        className="text-[9px] font-black text-orange-600 hover:scale-105 active:scale-95 flex items-center gap-1 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg transition-all"
                                    >
                                        {u.name} &rarr;
                                    </button>
                                ))}
                            </div>
                            <Link to="/equipe" className="mt-2 block text-[9px] font-black text-blue-600 hover:underline uppercase tracking-widest italic animate-pulse">
                                #agendar_exames &rarr;
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-4 flex items-center gap-2 text-emerald-600">
                             <CheckCircle size={14} />
                             <p className="text-[10px] font-black uppercase tracking-widest">Saúde Conforme</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Nova Seção: Oportunidades de Melhoria (Brain Intelligence) */}
            <AnimatePresence>
                {kpis?.opportunities?.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {kpis.opportunities.map((opt, idx) => (
                             <div key={idx} className={`p-4 rounded-2xl border flex items-center gap-4 ${opt?.type === 'lucro' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${opt.type === 'lucro' ? 'bg-blue-600 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg'}`}>
                                    {opt?.type === 'lucro' ? <TrendingUp size={24} /> : <AlertTriangle size={24} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-black text-sm uppercase tracking-tight italic">{opt?.title}</h5>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${opt?.type === 'lucro' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                            {opt?.impact}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium mt-0.5">{opt?.desc}</p>
                                </div>
                                <button className="p-2 hover:bg-white/50 rounded-lg transition-all font-black text-blue-600 text-xs uppercase tracking-tighter shrink-0">Explorar &rarr;</button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Passo 2.5: Inteligência Situacional (Risco e Cobertura) */}
            <SituationalRisk data={kpis?.situational} />

            {/* Passo 3: Gráficos Avançados (Radar & Análise Estrutural) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <SanitaryRadar data={kpis?.radar || {}} />
                <StructuralAnalysis data={kpis?.structural || []} />
            </div>

            {/* Passo 4: Operacional & RH */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                    <WasteStackedBar data={kpis?.waste?.byUnit || []} />
                </div>
                <div className="lg:col-span-1">
                    <HRAnalytics data={kpis?.health?.metrics || {}} />
                </div>
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
                                        {(action.employeeName || '?').charAt(0)}
                                    </div>
                                    <span className="text-[9px] font-black uppercase bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">#inapto</span>
                                </div>
                                <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{action.employeeName || 'Sem Nome'}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{action.role || 'Geral'} • {action.unitName || 'Unidade N/A'}</p>
                                
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

                                <button
                                    onClick={() => {
                                        const unit = units.find(u => u._id === action.unitId);
                                        if (unit) selectUnit(unit);
                                    }}
                                    className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-100"
                                >
                                    Investigar Unidade
                                </button>
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
                                <p className="text-sm text-slate-600 leading-relaxed mb-4">{feed.msg}</p>
                                <button
                                    onClick={() => {
                                        const unit = units.find(u => u._id === feed.unitId);
                                        if (unit) selectUnit(unit);
                                    }}
                                    className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1"
                                >
                                    Ver Unidade &rarr;
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default Home;
