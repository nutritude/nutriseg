import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Building2, AlertTriangle, ShieldCheck } from 'lucide-react';

const StructuralAnalysis = ({ data }) => {
    // data format: [{ id, name, count, issues: [] }]
    const chartData = data?.map(u => ({
        name: u.name,
        count: u.count,
        id: u.id
    })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5 problemáticos

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full flex flex-col justify-between">
            <div className="mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                           <Building2 size={24} className="text-orange-500" />
                           Inconformidades Estruturais
                        </h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Ranking de Problemas Físicos</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[250px]">
                {chartData?.length > 0 && chartData.some(d => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData} margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                                width={80}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700">
                                                <p className="text-[10px] font-black uppercase mb-1">{payload[0].payload.name}</p>
                                                <p className="text-xs font-bold text-orange-400">{payload[0].value} Falhas Estruturais</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={20}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#f97316'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                        <ShieldCheck size={48} className="text-emerald-500 opacity-20" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">Estruturas 100% Conformes<br/>em todos os contratos</p>
                    </div>
                )}
            </div>

            <div className="mt-8 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principais Pontos de Atenção</h4>
                <div className="grid grid-cols-1 gap-2">
                    {data?.filter(u => u.count > 0).slice(0, 2).map(u => (
                        <div key={u.id} className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 group hover:bg-red-100 transition-all">
                            <AlertTriangle size={16} className="text-red-600 animate-pulse" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-red-900 truncate">{u.name}</p>
                                <p className="text-[9px] text-red-700 font-bold truncate opacity-70">
                                    {u.issues?.[0] || 'Várias inconformidades estruturais'}
                                </p>
                            </div>
                            <span className="text-[10px] font-black text-red-600 bg-white px-2 py-1 rounded-lg shadow-sm">
                                {u.count}x
                            </span>
                        </div>
                    ))}
                    {(!data || data.every(u => u.count === 0)) && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                            <ShieldCheck size={16} className="text-emerald-600" />
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Manutenção em dia</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StructuralAnalysis;
