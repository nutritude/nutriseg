import React from 'react';
import { Calendar } from 'lucide-react';

const EventsPage = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
                <Calendar className="text-uan-primary" /> Agenda de Eventos
            </h1>
            <p className="text-gray-500">Calendário corporativo, eventos especiais e auditorias agendadas.</p>
        </div>
    );
};

export default EventsPage;
