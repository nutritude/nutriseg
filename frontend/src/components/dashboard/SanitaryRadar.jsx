import React from 'react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const SanitaryRadar = ({ data }) => {
    // data format: { estrutura: 85, higiene: 92, temperaturas: 70, documentacao: 60, pragas: 100 }
    const chartData = [
        { subject: 'Estrutura', A: data.estrutura, fullMark: 100 },
        { subject: 'Higiene', A: data.higiene, fullMark: 100 },
        { subject: 'Temperaturas', A: data.temperaturas, fullMark: 100 },
        { subject: 'Documentação', A: data.documentacao, fullMark: 100 },
        { subject: 'Pragas', A: data.pragas, fullMark: 100 },
    ];

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Performance Sanitária (CVS 5)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Conformidade"
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SanitaryRadar;
