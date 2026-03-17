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
    ChefHat,
    Hammer
} from 'lucide-react';

// Largura da sidebar: constante e compartilhada
export const SIDEBAR_WIDTH = 256; // 16rem = w-64

const Sidebar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Unidades', path: '/unidades', icon: Building2 },
        { name: 'Cardápio Digital', path: '/cardapio', icon: ChefHat },
        { name: 'Rota de Visitas', path: '/visitas', icon: Map },
        { name: 'Solicitações & Pedidos', path: '/ocorrencias', icon: BellRing },
        { name: 'Agenda de Eventos', path: '/agenda', icon: Calendar },
        { name: 'Equipe e RH', path: '/equipe', icon: Users },
        { name: 'Infraestrutura', path: '/infraestrutura', icon: Hammer },
        { name: 'Relatórios', path: '/relatorios', icon: BarChart3 },
    ];

    return (
        <>
            {/* Botão mobile fixo */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Abrir menu"
                className="md:hidden fixed z-50 bottom-5 right-5 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-700"
            >
                {isOpen ? <X size={22} /> : <MenuIcon size={22} />}
            </button>

            {/* Overlay mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/*
              Sidebar:
              - Desktop: estática (md:static), sempre visível, nunca se move
              - Mobile: overlay deslizante (fixed)
              - Largura sempre w-64 (256px) — NUNCA varia
              - h-full para preencher o contêiner flex pai (h-screen)
            */}
            <aside
                style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, maxWidth: SIDEBAR_WIDTH }}
                className={`
                    bg-slate-900 text-white flex flex-col h-full z-40 border-r border-slate-800
                    transition-transform duration-300 ease-in-out
                    fixed top-0 left-0 bottom-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0 md:flex md:shrink-0
                `}
            >
                {/* Logo / Branding */}
                <div className="p-5 border-b border-white/10 shrink-0">
                    <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <ChefHat className="h-5 w-5 text-white" />
                        </div>
                        UAN Gestor
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-widest font-semibold pl-1">
                        Gestão Estratégica
                    </p>
                </div>

                {/* Nav itens com scroll interno */}
                <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <ul className="space-y-0.5 px-3">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                                            ${isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }
                                        `}
                                    >
                                        <Icon
                                            size={18}
                                            className={isActive ? 'text-white' : 'text-slate-500'}
                                        />
                                        <span className="font-semibold text-[13px] truncate">
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer do usuário */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shrink-0">
                            <span className="font-bold text-sm text-white">JS</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-200 truncate">João Silva</p>
                            <p className="text-xs text-blue-400 truncate">Supervisão Técnica</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
