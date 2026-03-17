import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Users, UserMinus, Umbrella, AlertCircle } from 'lucide-react';

const HRAnalytics = ({ data }) => {
    // data format: { aptos, inaptos, afastados, ferias, total }
    const chartData = [
        { name: 'Aptos', value: data?.aptos || 0, color: '#10b981' },
        { name: 'Inaptos', value: data?.inaptos || 0, color: '#ef4444' },
        { name: 'Afastados', value: data?.afastados || 0, color: '#f59e0b' },
        { name: 'Férias', value: data?.ferias || 0, color: '#3b82f6' },
    ].filter(d => d.value > 0);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                       <Users size={24} className="text-blue-600" />
                       Status da Equipe (RH)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Disponibilidade e Saúde do Quadro</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-slate-800">{data?.total || 0}</span>
                    <p className="text-[8px] text-slate-400 font-black uppercase">Total</p>
                </div>
            </div>

            <div className="flex-1 min-h-[200px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-300">
                        <p className="text-xs font-bold uppercase tracking-widest text-center">Aguardando dados da equipe...</p>
                    </div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-orange-50 p-3 rounded-2xl flex items-center gap-3">
                    <UserMinus size={16} className="text-orange-600" />
                    <div>
                        <p className="text-[10px] font-black text-orange-900">{data?.afastados || 0}</p>
                        <p className="text-[8px] text-orange-600 font-bold uppercase">Afastados</p>
                    </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl flex items-center gap-3">
                    <Umbrella size={16} className="text-blue-600" />
                    <div>
                        <p className="text-[10px] font-black text-blue-900">{data?.ferias || 0}</p>
                        <p className="text-[8px] text-blue-600 font-bold uppercase">Em Férias</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRAnalytics;
