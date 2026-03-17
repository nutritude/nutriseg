import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    Plus, 
    ChevronLeft, 
    ChevronRight, 
    MapPin, 
    Clock, 
    Star, 
    Package, 
    Camera, 
    CheckCircle2, 
    Printer, 
    Info, 
    AlertTriangle,
    Image as ImageIcon,
    Layout,
    ClipboardList,
    TrendingUp,
    Filter,
    Trash2,
    PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventService from '../services/EventService';
import UnitService from '../services/UnitService';
import PDFService from '../services/PDFService';
import { useUnit } from '../contexts/UnitContext';

const EventsPage = () => {
    const { selectedUnit: contextUnit } = useUnit();
    const [events, setEvents] = useState([]);
    const [units, setUnits] = useState([]);
    const [view, setView] = useState('calendar'); // 'calendar', 'create', 'audit'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    
    // Calendário Social & Datas Importantes
    const socialCalendar = {
        '03-08': { name: 'Dia Internacional da Mulher', type: 'Especial' },
        '05-01': { name: 'Dia do Trabalhador', type: 'Especial' },
        '09-07': { name: 'Independência do Brasil', type: 'Especial' },
        '10-12': { name: 'Dia das Crianças', type: 'Especial' },
        '12-25': { name: 'Natal', type: 'Especial' }
    };

    const monthlyThemes = {
        10: { name: 'Outubro Rosa', color: 'bg-pink-100 text-pink-700', border: 'border-pink-200' },
        11: { name: 'Novembro Azul', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
        12: { name: 'Dezembro Vermelho', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
        9: { name: 'Setembro Amarelo', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' }
    };

    // Create/Edit Event Form State
    const [formData, setFormData] = useState({
        title: '',
        type: 'Festival',
        unitId: '',
        companyName: '',
        meal: 'Almoço',
        date: '',
        observations: '',
        checklist_materials: []
    });

    const mealTypes = ['Café da Manhã', 'Almoço', 'Jantar', 'Ceia', 'Evento Especial'];

    const eventTypes = [
        { id: 'Festival', name: 'Festival Temático', color: 'bg-orange-100 text-orange-700' },
        { id: 'Especial', name: 'Datas Comemorativas', color: 'bg-purple-100 text-purple-700' },
        { id: 'Campanha', name: 'Campanha de Saúde', color: 'bg-pink-100 text-pink-700' },
        { id: 'Personalizado', name: 'Evento Personalizado', color: 'bg-blue-100 text-blue-700' }
    ];

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        try {
            const [eventsData, unitsData] = await Promise.all([
                EventService.getEvents(),
                UnitService.getUnits()
            ]);
            setEvents(eventsData || []);
            setUnits(unitsData.units || []);
        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
        }
    };

    const handleDateClick = async (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        if (dateStr < today) {
            alert('Regra de Ouro: Não é permitido agendamentos em datas retroativas.');
            return;
        }

        setFormData({ 
            title: '',
            type: 'Festival',
            unitId: contextUnit?._id || '',
            companyName: contextUnit?.name || '',
            meal: 'Almoço',
            date: dateStr,
            observations: '',
            checklist_materials: []
        });
        setIsEditing(false);
        const availableItems = await EventService.getMaterialsAvailability(dateStr);
        setMaterials(availableItems || []);
        setView('create');
    };

    const handleEditClick = async (event) => {
        // Blindagem: Extrai os dados se vierem envoltos em 'data' do backend ou diretamente
        const eventData = event.data ? { ...event.data, _id: event._id } : { ...event };
        
        setFormData({
            ...eventData
        });
        setIsEditing(true);
        const availableItems = await EventService.getMaterialsAvailability(event.date);
        setMaterials(availableItems || []);
        setView('create');
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
            try {
                await EventService.deleteEvent(id);
                setView('calendar');
                loadData();
            } catch (error) {
                alert('Erro ao excluir evento.');
            }
        }
    };

    const toggleMaterial = (item) => {
        const exists = formData.checklist_materials.find(m => m.item_id === item._id);
        if (exists) {
            setFormData({
                ...formData,
                checklist_materials: formData.checklist_materials.filter(m => m.item_id !== item._id)
            });
        } else {
            setFormData({
                ...formData,
                checklist_materials: [
                    ...formData.checklist_materials, 
                    { item_id: item._id, name: item.name, quantity: 1, category: item.category, conferido_saida: false, conferido_retorno: false }
                ]
            });
        }
    };

    const handleSaveEvent = async () => {
        try {
            const unit = units.find(u => u._id === formData.unitId);
            const payload = {
                ...formData,
                unitName: unit?.name,
                status: formData.status || 'Agendado',
                updatedAt: new Date()
            };

            if (isEditing) {
                await EventService.updateEvent(formData._id, payload);
            } else {
                payload.createdAt = new Date();
                await EventService.createEvent(payload);
            }
            
            setView('calendar');
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao processar evento.');
        }
    };

    const handleAuditCheck = (idx, type) => {
        const newChecklist = [...selectedEvent.checklist_materials];
        newChecklist[idx][type] = !newChecklist[idx][type];
        setSelectedEvent({ ...selectedEvent, checklist_materials: newChecklist });
    };

    const saveAudit = async (status) => {
        try {
            const dataToUpdate = {
                checklist_materials: selectedEvent.checklist_materials,
                status: status,
                occurrence_report: selectedEvent.occurrence_report || ''
            };
            
            await EventService.updateChecklist(selectedEvent._id, dataToUpdate);
            setView('calendar');
            loadData();
        } catch (error) {
            alert('Erro ao salvar auditoria.');
        }
    };

    // Render Calendar
    const renderCalendar = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const days = [];
        
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return (
            <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="bg-white p-4 text-center text-[10px] font-black underline decoration-blue-500 uppercase tracking-widest text-slate-400">{d}</div>
                ))}
                {days.map((day, idx) => {
                    const monthPlusOne = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const dayStr = day ? String(day).padStart(2, '0') : null;
                    const dateStr = day ? `${currentDate.getFullYear()}-${monthPlusOne}-${dayStr}` : null;
                    const socialKey = day ? `${monthPlusOne}-${dayStr}` : null;
                    
                    const dayEvents = events.filter(e => e.date === dateStr);
                    const socialDate = socialCalendar[socialKey];
                    
                    return (
                        <div 
                            key={idx} 
                            onClick={() => day && handleDateClick(dateStr)}
                            className={`min-h-[140px] bg-white p-3 cursor-pointer hover:bg-slate-50 transition-all border-r border-b border-slate-50 ${!day ? 'bg-slate-50/50 outline-none' : ''}`}
                        >
                            {day && (
                                <>
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-black text-slate-400">{day}</span>
                                        {socialDate && (
                                            <div className="bg-yellow-50 text-yellow-700 p-1 rounded-md" title={socialDate.name}>
                                                <Star size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-2 space-y-1">
                                        {socialDate && (
                                            <div className="text-[8px] font-black uppercase text-yellow-600 truncate bg-yellow-50/50 p-1 rounded">
                                                ★ {socialDate.name}
                                            </div>
                                        )}
                                        {dayEvents.map(e => (
                                            <div 
                                                key={e._id} 
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    setSelectedEvent(e);
                                                    setView('audit');
                                                }}
                                                className={`text-[9px] font-bold p-1.5 rounded-lg truncate border shadow-sm flex flex-col gap-0.5 ${
                                                    (e.status || e.data?.status) === 'Realizado' ? 'bg-green-50 text-green-700 border-green-100' : 
                                                    (e.status || e.data?.status) === 'Confirmado' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    (e.status || e.data?.status) === 'Realizado com Ocorrência' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${
                                                        (e.status || e.data?.status) === 'Realizado' ? 'bg-green-500' : 
                                                        (e.status || e.data?.status) === 'Realizado with Ocorrência' ? 'bg-amber-500' :
                                                        'bg-blue-500 animate-pulse'
                                                    }`}></div>
                                                    <span className="truncate">{e.companyName || e.data?.companyName || e.unitName || e.data?.unitName}</span>
                                                </div>
                                                <div className="opacity-80 text-[8px] truncate">
                                                    {e.title || e.data?.title} ({(e.meal || e.data?.meal) || 'N/A'})
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <CalendarIcon size={32} className="text-purple-600" />
                        Agenda de Eventos & Logística
                    </h1>
                    <p className="text-slate-500 font-medium">Gestão de eventos temáticos, reservas de decoração e BI de engajamento.</p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => setView('calendar')}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${view === 'calendar' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 border border-slate-100'}`}
                    >
                        Calendário
                    </button>
                    {/* Botão de BI aqui talvez */}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {view === 'calendar' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <h2 className="text-3xl font-black text-slate-800">
                                        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                                    </h2>
                                    {monthlyThemes[currentDate.getMonth() + 1] && (
                                        <div className={`mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-2 border w-fit ${monthlyThemes[currentDate.getMonth() + 1].color} ${monthlyThemes[currentDate.getMonth() + 1].border}`}>
                                            <div className="h-2 w-2 rounded-full bg-current"></div>
                                            Mês Temático: {monthlyThemes[currentDate.getMonth() + 1].name}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronLeft /></button>
                                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronRight /></button>
                                </div>
                            </div>
                            
                            <div className="flex gap-6 items-center">
                                <div className="flex gap-4">
                                    {eventTypes.map(t => (
                                        <div key={t.id} className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${t.color.split(' ')[0]}`}></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {renderCalendar()}
                    </motion.div>
                )}

                {view === 'create' && (
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                        <Layout className="text-purple-600" /> {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
                                    </h3>
                                    {isEditing && (
                                        <button 
                                            onClick={() => handleDeleteEvent(formData._id)}
                                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                            title="Excluir Evento"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Título do Evento</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: Festival de Massas da Unidade..." 
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Data Selecionada</label>
                                            <div className="px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-black text-slate-400 flex items-center gap-3">
                                                <CalendarIcon size={18} /> {new Date(formData.date).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tipo de Evento</label>
                                            <select 
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                {eventTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Empresa / Cliente</label>
                                            <input 
                                                type="text" 
                                                placeholder="Nome da Empresa..." 
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                                value={formData.companyName}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Refeição</label>
                                            <select 
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                                value={formData.meal}
                                                onChange={(e) => setFormData({ ...formData, meal: e.target.value })}
                                            >
                                                {mealTypes.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unidade Destino</label>
                                        <select 
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                            value={formData.unitId}
                                            onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                        >
                                            <option value="">Selecione a UAN...</option>
                                            {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Justificativa / Briefing</label>
                                        <textarea 
                                            placeholder="Descreve o objetivo do evento..." 
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                                            value={formData.observations}
                                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Package className="text-purple-600" /> Reserva de Materiais
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Disponibilidade para: {new Date(formData.date).toLocaleDateString()}</p>
                                
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {materials.map((item) => (
                                        <div 
                                            key={item._id} 
                                            onClick={() => item.available && toggleMaterial(item)}
                                            className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${
                                                !item.available ? 'opacity-40 bg-slate-50 border-transparent cursor-not-allowed' :
                                                formData.checklist_materials.some(m => m.item_id === item._id) ? 'bg-purple-50 border-purple-500' : 'bg-white border-slate-50 hover:border-purple-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${formData.checklist_materials.some(m => m.item_id === item._id) ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{item.category}</span>
                                                </div>
                                            </div>
                                            {!item.available && <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-2 py-1 rounded-full uppercase">Reservado</span>}
                                            {formData.checklist_materials.some(m => m.item_id === item._id) && <CheckCircle2 className="text-purple-600" size={20} />}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-50">
                                    <button 
                                        disabled={!formData.title || !formData.unitId || formData.checklist_materials.length === 0}
                                        onClick={handleSaveEvent}
                                        className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 shadow-xl shadow-purple-400/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Star size={18} /> {isEditing ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'audit' && selectedEvent && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Event Info Card */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl sticky top-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-14 w-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-50">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedEvent.title || selectedEvent.data?.title}</h2>
                                            <button 
                                                onClick={() => handleDeleteEvent(selectedEvent._id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Excluir Evento"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-black bg-purple-50 text-purple-700 px-2 py-1 rounded-full uppercase mt-2 inline-block">{selectedEvent.type || selectedEvent.data?.type}</p>
                                        <p className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-1 rounded-full uppercase mt-2 inline-block ml-2">{(selectedEvent.meal || selectedEvent.data?.meal) || 'Almoço'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10">
                                    <div className="flex flex-col gap-1 border-l-4 border-blue-500 pl-4 py-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">Empresa / Unidade</span>
                                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                                            <MapPin size={16} /> {selectedEvent.companyName || selectedEvent.unitName}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 font-bold border-l-4 border-purple-500 pl-4 py-1">
                                        <Clock size={20} /> {new Date(selectedEvent.date).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-slate-100">
                                    <button 
                                        onClick={() => handleEditClick(selectedEvent)}
                                        className="w-full p-4 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center justify-between hover:bg-slate-100 transition-all"
                                    >
                                        <span className="flex items-center gap-2"><PenTool size={18} /> Editar Agendamento</span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button 
                                        onClick={() => PDFService.generatePackingListPDF(selectedEvent)}
                                        className="w-full p-4 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center justify-between hover:bg-slate-100 transition-all"
                                    >
                                        <span className="flex items-center gap-2"><Printer size={18} /> Packing List PDF</span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button 
                                        onClick={() => window.print()}
                                        className="w-full p-4 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center justify-between hover:bg-slate-100 transition-all"
                                    >
                                        <span className="flex items-center gap-2"><ImageIcon size={18} /> Protocolo de Fotos</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                <button onClick={() => setView('calendar')} className="mt-8 w-full py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest transition-all">Voltar para Agenda</button>
                            </div>
                        </div>

                        {/* Audit / Checklist Section */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <ClipboardList className="text-purple-600" /> Checklist de Auditoria
                                    </h3>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-2xl">
                                        <TrendingUp size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">BI: IA 92%</span>
                                    </div>
                                </div>

                                <div className="space-y-0 border border-slate-100 rounded-[2rem] overflow-hidden">
                                    <div className="grid grid-cols-12 bg-slate-50 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="col-span-6">Item de Decoração</div>
                                        <div className="col-span-3 text-center">Protocolo Saída</div>
                                        <div className="col-span-3 text-center">Protocolo Retorno</div>
                                    </div>
                                    
                                    {(selectedEvent.checklist_materials || selectedEvent.data?.checklist_materials || []).map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 p-6 border-t border-slate-50 items-center hover:bg-slate-50 transition-colors">
                                            <div className="col-span-6 flex gap-4 items-center">
                                                <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all"><Package size={18} /></div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.quantity} {item.unit || 'UN'}</p>
                                                </div>
                                            </div>
                                            <div className="col-span-3 flex justify-center">
                                                <button 
                                                    onClick={() => handleAuditCheck(idx, 'conferido_saida')}
                                                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${item.conferido_saida ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-300'}`}
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            </div>
                                            <div className="col-span-3 flex justify-center">
                                                <button 
                                                    onClick={() => handleAuditCheck(idx, 'conferido_retorno')}
                                                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${item.conferido_retorno ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-300'}`}
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Camera className="text-slate-400" />
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight text-xl">Protocolo Visual da Montagem</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Obrigatório antes do início do serviço</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="aspect-square bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-purple-400 hover:text-purple-400 cursor-pointer transition-all">
                                            <Plus />
                                            <span className="text-[10px] font-black uppercase mt-2">Buffet Principal</span>
                                        </div>
                                        <div className="aspect-square bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-purple-400 hover:text-purple-400 cursor-pointer transition-all">
                                            <Plus />
                                            <span className="text-[10px] font-black uppercase mt-2">Salão</span>
                                        </div>
                                        <div className="aspect-square bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-purple-400 hover:text-purple-400 cursor-pointer transition-all">
                                            <Plus />
                                            <span className="text-[10px] font-black uppercase mt-2">Geral</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-6">
                                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Validar Status do Evento</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {['Agendado', 'Confirmado', 'Realizado', 'Realizado com Ocorrência'].map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => setSelectedEvent({ ...selectedEvent, status: st })}
                                                    className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border-2 ${
                                                        (selectedEvent.status || selectedEvent.data?.status) === st 
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(selectedEvent.status || selectedEvent.data?.status) === 'Realizado com Ocorrência' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                                            <div className="flex items-center gap-3 mb-4 text-amber-700">
                                                <AlertTriangle size={18} />
                                                <h4 className="text-[10px] font-black uppercase tracking-widest">Relato da Ocorrência</h4>
                                            </div>
                                            <textarea 
                                                className="w-full p-4 bg-white border border-amber-100 rounded-2xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                                                placeholder="Descreva o que ocorreu durante o evento..."
                                                value={selectedEvent.occurrence_report || selectedEvent.data?.occurrence_report || ''}
                                                onChange={(e) => setSelectedEvent({ ...selectedEvent, occurrence_report: e.target.value })}
                                            />
                                        </motion.div>
                                    )}

                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => saveAudit(selectedEvent.status || 'Confirmado')}
                                            className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                        >
                                            Salvar Progresso
                                        </button>
                                        <button 
                                            onClick={() => saveAudit(selectedEvent.status === 'Realizado com Ocorrência' ? 'Realizado com Ocorrência' : 'Realizado')}
                                            className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-400/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle2 size={18} /> Finalizar Evento
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* BI Insights */}
                            <div className="bg-purple-900 p-8 rounded-[3rem] text-white overflow-hidden relative shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
                                <h4 className="text-xl font-black mb-4 flex items-center gap-3"><AlertTriangle className="text-yellow-400" /> BI Predict</h4>
                                <p className="text-sm font-medium leading-relaxed opacity-80 mb-6">
                                    Baseado em eventos anteriores deste tipo nesta unidade, projetamos um aumento de <b>15% no Índice de Aceitabilidade</b>. 
                                    Certifique-se de que a sinalização de displays está legível para otimizar o fluxo do buffet em <b>8%</b>.
                                </p>
                                <div className="flex gap-4">
                                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Custo Estimado</p>
                                        <p className="text-lg font-black font-mono">R$ 450,00</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Satisfação Projetada</p>
                                        <p className="text-lg font-black font-mono">9.4/10</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventsPage;
