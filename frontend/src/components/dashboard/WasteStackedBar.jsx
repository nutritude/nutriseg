import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const WasteStackedBar = ({ data }) => {
    // data format: [{ name: 'Unidade A', produzido: 500, sobra: 20, resto: 15 }, ...]
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Eficiência Operacional e Desperdício</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="produzido" name="Peso Produzido (kg)" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sobra" name="Sobra Limpa (kg)" stackId="a" fill="#10b981" />
                    <Bar dataKey="resto" name="Resto-Ingesta (kg)" stackId="a" fill="#ef4444" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WasteStackedBar;
