import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            {/* Main content area - responsive margin for sidebar */}
            <main className="flex-1 md:ml-64 w-full min-h-screen">
                <div className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
