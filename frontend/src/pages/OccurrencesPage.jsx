import React from 'react';
import { BellRing } from 'lucide-react';

const OccurrencesPage = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <BellRing className="text-uan-primary" /> Solicitações e Ocorrências
            </h1>
            <p className="text-gray-500">Central de chamados, SAC interno e registro de intercorrências.</p>
        </div>
    );
};

export default OccurrencesPage;
