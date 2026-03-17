import React from 'react';
import { Thermometer, MapPin, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useUnit } from '../../contexts/UnitContext';

const CriticalTemperatureCard = ({ criticalData }) => {
    // criticalData: { count: 3, units: [{id, name}] }
    const { selectUnit } = useUnit();

    if (!criticalData || criticalData.count === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl shadow-lg mb-8"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-red-500 p-2 rounded-full text-white animate-pulse">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-red-800">Status Crítico: Zona de Perigo</h3>
                        <p className="text-red-600 text-sm font-medium">Violação de temperatura detectada nas últimas 24h</p>
                    </div>
                </div>
                <Link 
                    to="/checklist"
                    className="text-xs font-black uppercase text-red-600 hover:text-red-800 underline transition-colors"
                >
                    Ver Laudos Completos
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criticalData.units.map((unit, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => selectUnit(unit)}
                        className="bg-white/60 p-4 rounded-xl border border-red-100 flex items-center gap-3 hover:bg-white transition-all text-left group"
                    >
                        <MapPin className="text-red-500 group-hover:scale-110 transition-transform" size={20} />
                        <div>
                            <span className="font-black text-slate-800 block text-sm leading-tight">{unit.name}</span>
                            <span className="text-[10px] font-bold text-red-500 uppercase">#investigar_agora</span>
                        </div>
                        <div className="ml-auto flex items-center text-red-600 font-bold bg-red-100/50 px-2 py-1 rounded-lg">
                            <Thermometer size={14} />
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

export default CriticalTemperatureCard;
