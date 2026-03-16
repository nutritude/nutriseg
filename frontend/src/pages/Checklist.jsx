import React, { useState, useEffect } from 'react';
import ChecklistService from '../services/ChecklistService';
import UnitService from '../services/UnitService';
import { ClipboardCheck, Plus, FileText, CheckCircle, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ChecklistPage = () => {
    const [templates, setTemplates] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [units, setUnits] = useState([]);
    const [view, setView] = useState('list'); // 'list', 'new-template', 'fill', 'check-in'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [checkInStatus, setCheckInStatus] = useState('pending'); // 'pending', 'success', 'failed'

    // Form States for Template
    const [newTemplateName, setNewTemplateName] = useState('');
    const [questions, setQuestions] = useState([{ text: '', weight: 1 }]);

    // Form States for Submission
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [temps, subs, unitsData] = await Promise.all([
                ChecklistService.getTemplates(),
                ChecklistService.getSubmissions(),
                UnitService.getUnits()
            ]);
            setTemplates(temps);
            setSubmissions(subs);
            setUnits(unitsData.units || []);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Raio da Terra em metros
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distância em metros
    };

    const handleCheckIn = () => {
        if (!selectedUnit) return;
        setCheckInStatus('checking');

        if (!navigator.geolocation) {
            setCheckInStatus('failed');
            alert('Geolocalização não suportada no seu navegador.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const coords = { lat: latitude, lng: longitude };

                // Persistência Offline Preventiva
                localStorage.setItem(`last_checkin_${selectedUnit._id}`, JSON.stringify({
                    coords,
                    timestamp: new Date().toISOString(),
                    unitName: selectedUnit.name
                }));

                setUserLocation(coords);

                // Cálculo Real de Geofencing (Haversine)
                const unitLat = selectedUnit.location?.lat;
                const unitLng = selectedUnit.location?.lng;

                if (!unitLat || !unitLng) {
                    alert('Erro: Coordenadas da unidade não cadastradas.');
                    setCheckInStatus('failed');
                    return;
                }

                const distance = haversineDistance(latitude, longitude, unitLat, unitLng);
                const isNear = distance <= 100; // Regra: 100 metros

                if (isNear) {
                    setCheckInStatus('success');
                    setView('fill');
                } else {
                    setCheckInStatus('failed');
                    alert(`Você está a ${Math.round(distance)}m da unidade. Você precisa estar a menos de 100m para iniciar a vistoria.`);
                }
            },
            (error) => {
                console.error("Erro GPS:", error);
                setCheckInStatus('failed');
                // Tenta recuperar do localStorage se falhar (ex: falta de sinal no subsolo)
                const saved = localStorage.getItem(`last_checkin_${selectedUnit._id}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const diff = (new Date() - new Date(parsed.timestamp)) / 1000 / 60; // Minutos
                    if (diff < 15) { // Se capturou há menos de 15 min, autoriza
                        setUserLocation(parsed.coords);
                        setCheckInStatus('success');
                        setView('fill');
                        return;
                    }
                }
                alert('Erro ao capturar GPS. Verifique se o sinal está ativo.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmitChecklist = async (e) => {
        e.preventDefault();
        try {
            const submissionData = {
                template: selectedTemplate._id,
                unitId: selectedUnit._id,
                location: userLocation,
                answers: Object.entries(answers).map(([qText, ans]) => ({
                    questionText: qText,
                    answer: ans
                })),
                date: new Date()
            };
            await ChecklistService.submit(submissionData);
            setView('list');
            loadData();
            alert('Checklist enviado com validação de GPS!');
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Auditoria de Qualidade</h1>
                    <p className="text-slate-500 font-medium">Gestão de Checklists Sanitários e Auditorias em Campo.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('new-template')}
                        className="bg-white border-2 border-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Plus size={20} />
                        Novo Modelo (RDC)
                    </button>
                    <button
                        onClick={() => setView('fill-select-unit')}
                        className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <ClipboardCheck size={20} />
                        Aplicar Checklist
                    </button>
                </div>
            </header>

            {view === 'list' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-extrabold text-xl mb-6 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FileText size={20} /></div>
                            Modelos Ativos
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {templates.map(t => (
                                <div key={t._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                                    <span className="font-bold text-slate-700">{t.name}</span>
                                    <span className="text-xs font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">
                                        {t.sections[0]?.questions.length} Itens
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-extrabold text-xl mb-6 flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg text-green-600"><CheckCircle size={20} /></div>
                            Aplicações Recentes
                        </h3>
                        <div className="space-y-4">
                            {submissions.map(s => (
                                <div key={s._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-slate-800">{s.template?.name || 'Checklist'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-400 font-bold uppercase">{new Date(s.date).toLocaleDateString()}</span>
                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-black">#gps_log</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Conforme</span>
                                        <span className="text-[9px] text-slate-400 mt-1">Auditado por IA</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'fill-select-unit' && (
                <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-2xl font-black text-slate-900">Onde a auditoria será aplicada?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        {units.map(unit => (
                            <button
                                key={unit._id}
                                onClick={() => { setSelectedUnit(unit); setView('fill-select-template'); }}
                                className="p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all group"
                            >
                                <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <MapPin size={24} />
                                </div>
                                <h4 className="font-black text-slate-800 text-lg">{unit.name}</h4>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded mt-2 inline-block ${unit.type === 'Transportada' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                    {unit.type}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {view === 'fill-select-template' && (
                <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-2xl font-black text-slate-900">Selecione o Protocolo</h3>
                    <div className="grid gap-3 text-left">
                        {templates.map(t => (
                            <button
                                key={t._id}
                                onClick={() => { setSelectedTemplate(t); setView('check-in'); }}
                                className="flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-purple-500 hover:shadow-xl transition-all group"
                            >
                                <div>
                                    <h4 className="font-black text-slate-800 text-xl">{t.name}</h4>
                                    <p className="text-sm text-slate-400 font-bold uppercase mt-1">{t.sections[0]?.questions.length} Verificações</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <ClipboardCheck size={28} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {view === 'check-in' && (
                <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center space-y-8 animate-in zoom-in duration-300">
                    <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-blue-600 relative">
                        <Navigation size={40} className="animate-bounce" />
                        <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Validando Localização</h3>
                        <p className="text-slate-500 font-medium mt-2">Para iniciar a auditoria na <b>{selectedUnit?.name}</b>, precisamos confirmar se você está no local.</p>
                    </div>

                    <button
                        onClick={handleCheckIn}
                        disabled={checkInStatus === 'checking'}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        {checkInStatus === 'checking' ? 'Validando GPS...' : 'Fazer Check-in Agora'}
                    </button>

                    {checkInStatus === 'failed' && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
                            <AlertCircle size={20} />
                            <p className="text-xs font-bold text-left">Não foi possível validar sua localização. Verifique se o GPS está ativado ou se você está a menos de 500m da unidade.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'fill' && selectedTemplate && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100"
                >
                    <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-8">
                        <div>
                            <h3 className="font-black text-2xl text-slate-900">{selectedTemplate.name}</h3>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Check-in OK</span>
                                <span className="text-slate-400 text-xs font-bold uppercase">{selectedUnit?.name}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-blue-600">
                                {Math.round((Object.keys(answers).length / selectedTemplate.sections[0].questions.length) * 100)}%
                            </div>
                            <span className="text-[10px] text-slate-400 font-black uppercase">Progresso</span>
                        </div>
                    </div>

                    {/* Diferenciação de Contrato: Alerta Cozinha Transportada */}
                    {selectedUnit?.type === 'Transportada' && (
                        <div className="mb-8 p-5 bg-orange-50 border-2 border-orange-100 rounded-3xl flex gap-4">
                            <AlertCircle className="text-orange-600 shrink-0" size={24} />
                            <div>
                                <h4 className="font-bold text-orange-900 text-sm">Protocolo: Alimento Transportado</h4>
                                <p className="text-xs text-orange-700 mt-1">Lembre-se de auditar o veículo de transporte, temperatura de entrega e condições das caixas isotérmicas.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmitChecklist} className="space-y-6">
                        {selectedTemplate.sections[0].questions.map((q, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-md transition-all">
                                <p className="font-bold text-slate-800 mb-4">{q.text}</p>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { label: 'Conforme', val: 'C', color: 'peer-checked:bg-green-500 peer-checked:text-white bg-green-50 text-green-700' },
                                        { label: 'Não Conforme', val: 'NC', color: 'peer-checked:bg-red-500 peer-checked:text-white bg-red-50 text-red-700' },
                                        { label: 'Não se Aplica', val: 'NA', color: 'peer-checked:bg-slate-500 peer-checked:text-white bg-slate-50 text-slate-700' }
                                    ].map(opt => (
                                        <label key={opt.val} className="flex-1 min-w-[120px] relative cursor-pointer">
                                            <input
                                                type="radio" name={`q-${idx}`} value={opt.val}
                                                onChange={() => setAnswers({ ...answers, [q.text]: opt.val })}
                                                required className="peer sr-only"
                                            />
                                            <div className={`px-4 py-3 rounded-xl text-xs font-bold text-center transition-all border border-transparent shadow-sm ${opt.color}`}>
                                                {opt.label}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-4 pt-10">
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className="flex-1 py-4 border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all"
                            >
                                Abandonar Auditoria
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-500/20"
                            >
                                Finalizar e Enviar Relatório
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </div>
    );
};

export default ChecklistPage;
