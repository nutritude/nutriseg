import React from 'react';
import { Thermometer, MapPin, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CriticalTemperatureCard = ({ criticalData }) => {
    // criticalData: { count: 3, units: ['ID1', 'ID2'] }
    if (criticalData.count === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl shadow-lg mb-8"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500 p-2 rounded-full text-white animate-pulse">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-red-800">Status Crítico: Zona de Perigo</h3>
                    <p className="text-red-600 text-sm font-medium">Detectado nas últimas 24h conforme CVS 5</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criticalData.units.map((unit, idx) => (
                    <div key={idx} className="bg-white/60 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                        <MapPin className="text-red-500" size={20} />
                        <span className="font-bold text-slate-700">{unit}</span>
                        <div className="ml-auto flex items-center text-red-600 font-bold">
                            <Thermometer size={16} />
                            <span>#critico</span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default CriticalTemperatureCard;
