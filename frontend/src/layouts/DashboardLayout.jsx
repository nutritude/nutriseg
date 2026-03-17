import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar fixa com largura padronizada */}
            <Sidebar />

            {/* Área principal: scroll independente, nunca sobreposta pela sidebar */}
            <main className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
