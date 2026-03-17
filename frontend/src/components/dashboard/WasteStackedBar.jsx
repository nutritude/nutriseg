import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((acc, entry) => acc + entry.value, 0);
        const lossValue = payload[0].payload.lossValue;

        return (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between gap-8 items-center">
                            <span className="text-[10px] font-bold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                {entry.name}:
                            </span>
                            <span className="text-xs font-black">{entry.value.toFixed(1)} kg</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-blue-400">
                        <span className="text-[10px] font-black uppercase">Perda Estimada:</span>
                        <span className="text-sm font-black italic">R$ {lossValue}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const WasteStackedBar = ({ data }) => {
    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-[500px] relative overflow-hidden group">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight italic flex items-center gap-2">
                        Eficiência Operacional & Desperdício
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Análise Quantitativa por Unidade</p>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fator Médio</span>
                    <span className="text-lg font-black text-blue-600 italic">16.50 R$/kg</span>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={0}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 12 }} />
                    <Legend 
                        iconType="circle" 
                        verticalAlign="top" 
                        align="right" 
                        wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}
                    />
                    <Bar dataKey="produzido" name="Produzido" stackId="a" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="sobra" name="Sobra Limpa" stackId="a" fill="#10b981" barSize={40} />
                    <Bar dataKey="resto" name="Resto-Ingesta" stackId="a" fill="#ef4444" barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WasteStackedBar;
