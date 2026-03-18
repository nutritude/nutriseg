import React, { useState, useEffect } from 'react';
import { 
    BellRing, 
    Plus, 
    FileText, 
    Printer, 
    Trash2, 
    Package, 
    UserPlus, 
    GraduationCap, 
    PenTool, 
    ShieldCheck, 
    ChevronRight, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle,
    Users,
    Clock,
    UserMinus,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnitService from '../services/UnitService';
import EmployeeService from '../services/EmployeeService';
import RequestService from '../services/RequestService';
import PDFService from '../services/PDFService';
import { useUnit } from '../contexts/UnitContext';

const OccurrencesPage = () => {
    const { selectedUnit: contextUnit } = useUnit();
    const [units, setUnits] = useState([]);
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [view, setView] = useState('list'); // 'list', 'create', 'success'
    const [step, setStep] = useState(0); // 0: Category, 1: Content
    
    // Form State
    const [category, setCategory] = useState(null);
    const [formData, setFormData] = useState({
        items: [],
        observations: '',
        rhAction: '',
        employeeId: '',
        employeeName: ''
    });

    const categories = [
        { id: 'Descartáveis', name: 'Descartáveis', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', items: ['Luvas Vinil', 'Máscaras Descartáveis', 'Toucas', 'Avental Plástico', 'Sacos de Lixo 100L', 'Papel Toalha'] },
        { id: 'EPIs', name: 'EPIs de Cozinha', icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50', items: ['Bota de Segurança', 'Luva de Malha de Aço', 'Avental Térmico', 'Meia Térmica', 'Óculos de Proteção'] },
        { id: 'Treinamentos', name: 'Treinamentos', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50', items: ['Higiene e Manipulação', 'Segurança do Trabalho (EPI)', 'Integração de Novos', 'Prevenção de Incêndios'] },
        { id: 'Escritório', name: 'Escritório', icon: PenTool, color: 'text-slate-600', bg: 'bg-slate-50', items: ['Canetas Azuis/Pretas', 'Réguas', 'Formulários CVS5', 'Etiquetas de Validade', 'Grampeador/Grampos'] },
        { id: 'RH', name: 'Recursos Humanos', icon: Users, color: 'text-red-600', bg: 'bg-red-50', items: [] }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [unitsData, requestsData] = await Promise.all([
                UnitService.getUnits(),
                RequestService.getRequests()
            ]);
            setUnits(unitsData.units || []);
            setRequests(requestsData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const loadUnitEmployees = async (unitId) => {
        try {
            const data = await EmployeeService.getEmployeesByUnit(unitId);
            setEmployees(data || []);
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
        }
    };

    const handleSelectCategory = (cat) => {
        setCategory(cat);
        setFormData({ ...formData, items: [], rhAction: '', employeeId: '' });
        if (cat.id === 'RH' && selectedUnit) {
            loadUnitEmployees(selectedUnit._id);
        }
        setStep(1);
    };

    const addItem = (itemName) => {
        if (!formData.items.some(i => i.name === itemName)) {
            setFormData({
                ...formData,
                items: [...formData.items, { name: itemName, quantity: 1, unit: 'un' }]
            });
        }
    };

    const removeItem = (idx) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const updateItemQty = (idx, qty) => {
        const newItems = [...formData.items];
        newItems[idx].quantity = qty;
        setFormData({ ...formData, items: newItems });
    };

    const handleUpdateStatus = async (requestId, newStatus) => {
        try {
            await RequestService.updateStatus(requestId, newStatus);
            loadData(); // Recarrega para refletir a mudança
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Falha ao atualizar o status da solicitação.');
        }
    };

    const getStatusOptions = (type) => {
        if (type === 'RH') {
            return [
                { val: 'Pendente', color: 'bg-orange-400', text: 'Pendente' },
                { val: 'Em Processamento (DP)', color: 'bg-blue-400', text: 'Em Processamento (DP)' },
                { val: 'Efetivado', color: 'bg-green-500', text: 'Efetivado' },
                { val: 'Reprovado (RH)', color: 'bg-red-500', text: 'Reprovado (RH)' },
                { val: 'Agendado', color: 'bg-purple-500', text: 'Agendado' }
            ];
        }
        return [
            { val: 'Pendente', color: 'bg-orange-400', text: 'Pendente' },
            { val: 'Entregue', color: 'bg-green-500', text: 'Entregue' },
            { val: 'Entrega Parcial', color: 'bg-yellow-500', text: 'Entrega Parcial' },
            { val: 'Cancelado', color: 'bg-slate-400', text: 'Cancelado' },
            { val: 'Solicitação Recusada', color: 'bg-red-500', text: 'Recusado' }
        ];
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                type: category.id,
                unitId: selectedUnit._id,
                unitName: selectedUnit.name,
                date: new Date(),
                status: 'Pendente',
                items: formData.items,
                observations: formData.observations,
                rhAction: formData.rhAction,
                employeeId: formData.employeeId,
                employeeName: formData.employeeName,
                auditorName: 'João Silva' // Mock por enquanto
            };

            await RequestService.createRequest(payload);
            setView('success');
            loadData();
            
            // Gerar PDF automaticamente
            setTimeout(() => {
                PDFService.generateRequestOrderPDF(payload);
            }, 500);

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Falha ao processar solicitação.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BellRing size={32} className="text-blue-600" />
                        Solicitações e Pedidos
                    </h1>
                    <p className="text-slate-500 font-medium">Insumos, EPIs, RH e Treinamentos Técnicos.</p>
                </div>

                {view === 'list' && (
                    <button 
                        onClick={() => {
                            if (contextUnit) setSelectedUnit(contextUnit);
                            setView('create');
                            setStep(0);
                        }}
                        className="bg-blue-600 text-white font-black px-8 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
                    >
                        <Plus size={20} /> Nova Solicitação
                    </button>
                )}
            </header>

            <AnimatePresence mode="wait">
                {view === 'list' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-6"
                    >
                        {/* Lista de Solicitações Recentes */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                    <FileText className="text-slate-400" /> Histórico de Pedidos
                                </h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
                                    <div className="flex gap-1">
                                        <span className="h-2 w-2 rounded-full bg-orange-400 mt-1"></span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Pendente</span>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidade</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumo</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {requests.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-8 py-10 text-center text-slate-400 font-medium">Nenhum pedido realizado recentemente.</td>
                                            </tr>
                                        ) : (
                                            requests.map((req) => (
                                                <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-sm">{new Date(req.date).toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold">{new Date(req.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 font-bold text-slate-600 text-sm">{req.unitName || req.unit?.data?.name || 'Unidade N/A'}</td>
                                                    <td className="px-8 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                            req.type === 'RH' ? 'bg-red-50 text-red-600' : 
                                                            req.type === 'EPIs' ? 'bg-orange-50 text-orange-600' : 
                                                            req.type === 'Treinamentos' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            {req.type || 'Geral'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4 text-sm text-slate-500 max-w-xs truncate">
                                                        {req.type === 'RH' ? 
                                                            `${req.rhAction || 'Ação RH'}: ${req.employeeName || 'N/A'}` : 
                                                            (req.items && req.items.length > 0 ? 
                                                                req.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 
                                                                (req.title || req.description || 'Pedido s/ itens'))
                                                        }
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <div className="relative group/status">
                                                            <select 
                                                                value={req.status}
                                                                onChange={(e) => handleUpdateStatus(req._id, e.target.value)}
                                                                className={`appearance-none font-black text-[10px] uppercase pl-6 pr-8 py-1.5 rounded-full border-2 transition-all cursor-pointer outline-none ${
                                                                    req.status === 'Efetivado' || req.status === 'Entregue' ? 'bg-green-50 border-green-200 text-green-600' :
                                                                    req.status === 'Pendente' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                                                                    req.status === 'Reprovado (RH)' || req.status === 'Solicitação Recusada' ? 'bg-red-50 border-red-200 text-red-600' :
                                                                    'bg-blue-50 border-blue-200 text-blue-600'
                                                                }`}
                                                            >
                                                                {getStatusOptions(req.type).map(opt => (
                                                                    <option key={opt.val} value={opt.val} className="text-slate-800 bg-white">{opt.text}</option>
                                                                ))}
                                                            </select>
                                                            <div className={`absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                                                                req.status === 'Efetivado' || req.status === 'Entregue' ? 'bg-green-500' :
                                                                req.status === 'Pendente' ? 'bg-orange-500 animate-pulse' :
                                                                req.status === 'Reprovado (RH)' || req.status === 'Solicitação Recusada' ? 'bg-red-500' :
                                                                'bg-blue-500'
                                                            }`}></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <button 
                                                            onClick={() => PDFService.generateRequestOrderPDF(req)}
                                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2 text-xs font-bold"
                                                        >
                                                            <Printer size={14} /> PDF
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {view === 'create' && (
                    <motion.div 
                        initial={{ scale: 0.98, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Sidebar / Progress */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><BellRing size={80} /></div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Fluxo de Pedido</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Passo {step + 1} de 2</p>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${step >= 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>1</div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700">Categoria</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Qual o tipo de recurso?</span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-slate-100 ml-5" />
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${step >= 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>2</div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700">Detalhamento</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Itens, Motivos e Prazos</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 pt-8 border-t border-slate-50">
                                    <button 
                                        onClick={() => setView('list')}
                                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                    >
                                        <ArrowLeft size={16} /> Cancelar Solicitação
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="lg:col-span-8">
                            <AnimatePresence mode="wait">
                                {step === 0 ? (
                                    /* Escolha da Categoria */
                                    <motion.div 
                                        key="step0"
                                        initial={{ x: 20, opacity: 0 }} 
                                        animate={{ x: 0, opacity: 1 }} 
                                        exit={{ x: -20, opacity: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                            <h2 className="text-xl font-black text-slate-800 mb-6">Selecione o Departamento</h2>
                                            
                                            <div className="mb-8">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unidade Solicitante</label>
                                                <select 
                                                    value={selectedUnit?._id || ''}
                                                    onChange={(e) => setSelectedUnit(units.find(u => u._id === e.target.value))}
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                >
                                                    <option value="" disabled>Escolha a unidade...</option>
                                                    {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        disabled={!selectedUnit}
                                                        onClick={() => handleSelectCategory(cat)}
                                                        className={`flex items-center gap-4 p-6 rounded-3xl border-2 transition-all text-left group ${
                                                            !selectedUnit ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-500 hover:shadow-xl bg-white border-slate-100'
                                                        }`}
                                                    >
                                                        <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color} group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                                                            {React.createElement(cat.icon, { size: 24 })}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-black text-slate-800 text-lg">{cat.name}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Solicitar provisão agora</p>
                                                        </div>
                                                        <ChevronRight className="text-slate-200 group-hover:text-blue-600" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    /* Detalhamento */
                                    <motion.div 
                                        key="step1"
                                        initial={{ x: 20, opacity: 0 }} 
                                        animate={{ x: 0, opacity: 1 }} 
                                        exit={{ x: -20, opacity: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-8 overflow-hidden">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-4 rounded-2xl ${category.bg} ${category.color}`}>
                                                        {React.createElement(category.icon, { size: 24 })}
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-black text-slate-800">{category.name}</h2>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedUnit?.name}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setStep(0)} className="text-slate-300 hover:text-blue-600 transition-colors"><RefreshCw size={20} /></button>
                                            </div>

                                            {category.id === 'RH' ? (
                                                /* Fluxo Especial para RH */
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Colaborador Alvo</label>
                                                            <select 
                                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                                                                value={formData.employeeId}
                                                                onChange={(e) => {
                                                                    const emp = employees.find(emp => emp._id === e.target.value);
                                                                    setFormData({ ...formData, employeeId: e.target.value, employeeName: emp?.data?.name || '' });
                                                                }}
                                                            >
                                                                <option value="">Selecione o profissional...</option>
                                                                {employees.map(e => <option key={e._id} value={e._id}>{e.data.name} ({e.data.role})</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ação Requerida</label>
                                                            <select 
                                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
                                                                value={formData.rhAction}
                                                                onChange={(e) => setFormData({ ...formData, rhAction: e.target.value })}
                                                            >
                                                                <option value="">Selecione a ação...</option>
                                                                <option value="Colocar em Aviso Prévio">Colocar em Aviso Prévio</option>
                                                                <option value="Dispensa Imediata">Dispensa Imediata</option>
                                                                <option value="Solicitar Substituição">Solicitar Substituição</option>
                                                                <option value="Mudança de Horário/Cargo">Mudança de Horário/Cargo</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    
                                                    {formData.rhAction === 'Solicitar Substituição' && (
                                                        <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
                                                            <Info size={24} className="shrink-0" />
                                                            <p className="text-xs font-medium">A IA do UAN Gestor sugere verificar a unidade <b>Matriz</b>, que possui 2 auxiliares disponíveis para remanejamento temporário.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Fluxo para Materiais/EPIs/Treinamentos */
                                                <div className="space-y-8">
                                                    {/* Smart Suggestions */}
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Sugestões Rápidas (Padrão CVS5/RDC)</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {category.items.map((item, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => addItem(item)}
                                                                    className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-500 hover:bg-white hover:text-blue-600 transition-all flex items-center gap-2"
                                                                >
                                                                    <Plus size={14} /> {item}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Lista de Itens do Pedido */}
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itens Selecionados</label>
                                                        <div className="space-y-3">
                                                            {formData.items.length === 0 && (
                                                                <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 text-sm font-medium">
                                                                    Adicione itens acima ou clique para escrever um novo.
                                                                </div>
                                                            )}
                                                            {formData.items.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                                                                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Package size={18} /></div>
                                                                    <div className="flex-1">
                                                                        <input 
                                                                            type="text" 
                                                                            value={item.name}
                                                                            onChange={(e) => {
                                                                                const newItems = [...formData.items];
                                                                                newItems[idx].name = e.target.value;
                                                                                setFormData({ ...formData, items: newItems });
                                                                            }}
                                                                            className="bg-transparent font-bold text-slate-700 w-full outline-none"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                                                        <input 
                                                                            type="number" 
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 0)}
                                                                            className="w-12 text-center text-sm font-bold text-blue-600 outline-none"
                                                                        />
                                                                        <span className="text-[10px] font-black text-slate-300 uppercase">UN</span>
                                                                    </div>
                                                                    <button onClick={() => removeItem(idx)} className="p-2 text-slate-200 hover:text-red-500 transition-all">
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-8 pt-8 border-t border-slate-50">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Justificativa / Observações Extras</label>
                                                <textarea 
                                                    value={formData.observations}
                                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                                    placeholder="Descreva o motivo da solicitação ou observações para o financeiro/suprimentos..."
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                                />
                                            </div>

                                            <div className="mt-10 flex gap-4">
                                                <button 
                                                    onClick={() => setStep(0)}
                                                    className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                                                >
                                                    Retornar
                                                </button>
                                                <button 
                                                    onClick={handleSubmit}
                                                    disabled={category.id !== 'RH' && formData.items.length === 0}
                                                    className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle2 size={18} /> Finalizar e Gerar Pedido
                                                </button>
                                            </div>
                                        </div>

                                        {/* Inteligência de Custo (Gap Opener) */}
                                        {category.id === 'Descartáveis' && formData.items.length > 0 && (
                                            <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex gap-4 items-start">
                                                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><AlertCircle size={24} /></div>
                                                <div>
                                                    <h4 className="font-black text-orange-900 text-sm">Alerta de Consumo</h4>
                                                    <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                                                        O pedido de <b>Luvas Vinil</b> está 20% acima da média de consumo per capita da unidade <b>{selectedUnit?.name}</b> para o volume de refeições atual. 
                                                        Recomendamos revisar se há desperdício no processo de pré-preparo.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {view === 'success' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-xl mx-auto py-20 text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
                            <CheckCircle2 size={48} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-slate-900">Pedido Formalizado!</h2>
                            <p className="text-slate-500 font-medium text-lg mt-3">Sua solicitação foi enviada para o departamento financeiro/suprimentos e o comprovante PDF foi gerado.</p>
                        </div>
                        
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 text-left">
                            <Clock className="text-blue-500" size={32} />
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Estimado de Retorno</p>
                                <p className="text-sm font-bold text-slate-700">Aprovação prevista em até 24h úteis.</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setView('list')}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                        >
                            Voltar para o Histórico
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OccurrencesPage;
