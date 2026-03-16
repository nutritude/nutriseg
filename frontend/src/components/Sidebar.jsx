import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    Map,
    BellRing,
    Calendar,
    Users,
    BarChart3,
    Menu as MenuIcon,
    X,
    ChefHat
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false); // Mobile toggle state

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Unidades', path: '/unidades', icon: Building2 },
        { name: 'Cardápio Digital', path: '/cardapio', icon: ChefHat },
        { name: 'Rota de Visitas', path: '/visitas', icon: Map },
        { name: 'Solicitações', path: '/ocorrencias', icon: BellRing },
        { name: 'Agenda de Eventos', path: '/agenda', icon: Calendar },
        { name: 'Equipe e RH', path: '/equipe', icon: Users },
        { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed z-50 bottom-4 right-4 bg-slate-900 text-white p-3 rounded-full shadow-lg"
            >
                {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                w-64 bg-slate-900 text-white flex flex-col h-screen fixed z-40 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static border-r border-slate-800
            `}>
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
                        <ChefHat className="h-8 w-8" />
                        UAN Gestor
                    </h1>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold ml-10">Gestão Estratégica</p>
                </div>

                <nav className="flex-1 overflow-y-auto py-6">
                    <ul className="space-y-1 px-3">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                                        <span className="font-medium text-sm">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                            <span className="font-bold text-lg text-white">JS</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-200">João Silva</p>
                            <p className="text-xs text-blue-400">Supervisão Técnica</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
