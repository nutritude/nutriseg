import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Target, Activity } from 'lucide-react';

const SituationalRisk = ({ data }) => {
    if (!data || !data.highRiskUnits) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="text-red-600" />
                        Controle Situacional e Preditivo
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Análise de Risco Cruzada: Auditoria + Treinamento + Saúde
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Cobertura de Treinamento</p>
                        <p className="text-sm font-black text-blue-600 italic">{Math.round(data.trainingCoverage)}% das Unidades</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ranking de Risco */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 italic flex items-center gap-2">
                        <Target className="text-red-500" size={18} /> Ranking de Risco Preditivo
                    </h3>
                    <div className="space-y-6">
                        {data.highRiskUnits.map((u, idx) => (
                            <div key={u.id} className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-300">#{idx + 1}</span>
                                        <span className="text-sm font-black text-slate-700">{u.name}</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                        u.level === 'CRÍTICO' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {u.level} • {u.riskScore}%
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${u.riskScore}%` }}
                                        className={`h-full transition-all duration-1000 ${
                                            u.riskScore >= 70 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-orange-400 to-orange-500'
                                        }`}
                                    />
                                </div>
                                {u.missingTraining && (
                                    <p className="text-[9px] font-bold text-red-500 uppercase mt-2 flex items-center gap-1 animate-pulse">
                                        <Zap size={10} /> Alerta: Ausência de treinamento técnico nos últimos 30 dias
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alertas Inteligentes */}
                <div className="space-y-4">
                    {data.alerts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-10 bg-emerald-50/50 rounded-[3rem] border border-emerald-100 text-center">
                            <Activity className="text-emerald-500 mb-4" size={48} />
                            <h4 className="text-lg font-black text-emerald-900 italic">Cenário Estabilizado</h4>
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mt-2">Nenhuma unidade em situação preditiva de risco alto sem cobertura de treinamento.</p>
                        </div>
                    ) : (
                        data.alerts.map((alert, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-slate-900 p-6 rounded-[2.5rem] text-white relative overflow-hidden group border border-slate-800"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform">
                                    <Zap size={60} className="text-blue-400" />
                                </div>
                                <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 italic">Ação Corretiva Recomendada</h4>
                                <h5 className="font-black text-lg italic mb-2">{alert.unitName}</h5>
                                <p className="text-xs text-slate-400 font-bold leading-relaxed mb-4">
                                    {alert.msg}
                                </p>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                                    Agendar Treinamento Imediato
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SituationalRisk;
