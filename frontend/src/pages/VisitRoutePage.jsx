import React, { useState, useEffect } from 'react';
import {
    Map as MapIcon,
    Navigation,
    Car,
    CreditCard,
    Save,
    History,
    MapPin,
    CheckCircle2,
    Plus,
    Trash2,
    Camera,
    Play,
    Flag,
    AlertCircle,
    Route as RouteIcon
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import UnitService from '../services/UnitService';
import LogisticsService from '../services/LogisticsService';

// Custom Marker Icon for Numbered Pins
const createNumberedIcon = (number, color = '#3b82f6') => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transform: translateY(-18px);">${number}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });
};

const VisitRoutePage = () => {
    const [units, setUnits] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [extraStops, setExtraStops] = useState([]);
    const [view, setView] = useState('planning');
    const [activePlan, setActivePlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [kmValue, setKmValue] = useState('');
    const [odometerPhoto, setOdometerPhoto] = useState(null);
    const [tolls, setTolls] = useState([]);
    const [routeData, setRouteData] = useState(null);

    useEffect(() => {
        loadData();
        detectStartingPoint();
    }, []);

    const detectStartingPoint = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = {
                    name: 'Minha Localização',
                    location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                    isStart: true
                };
                setUserLocation(loc);
                calculateOSRMRoute(selectedUnits, extraStops, loc);
            },
            () => console.warn("GPS não autorizado para início de rota"),
            { enableHighAccuracy: true }
        );
    };

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const loadData = async () => {
        try {
            const data = await UnitService.getUnits();
            const allUnits = data.units || [];
            setUnits(allUnits);

            // Recuperar rascunho offline
            const savedSelected = localStorage.getItem('logistics_draft_units');
            if (savedSelected) setSelectedUnits(JSON.parse(savedSelected));
        } catch (error) {
            console.error("Erro ao carregar unidades:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateOSRMRoute = async (selected, extras, start = userLocation) => {
        const points = [];
        if (start) points.push(start);
        points.push(...selected);
        points.push(...extras);

        if (points.length < 2) {
            setRouteData(null);
            return;
        }

        const validPoints = points.filter(p =>
            p.location &&
            (p.location.lat !== undefined || p.location.latitude !== undefined) &&
            (p.location.lng !== undefined || p.location.longitude !== undefined)
        );

        if (validPoints.length < 2) {
            setRouteData(null);
            return;
        }

        const coordsStr = validPoints.map(p => {
            const lat = p.location.lat !== undefined ? p.location.lat : p.location.latitude;
            const lng = p.location.lng !== undefined ? p.location.lng : p.location.longitude;
            return `${lng},${lat}`;
        }).join(';');
        try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`);
            const data = await res.json();
            if (data.code === 'Ok') {
                setRouteData(data.routes[0]);
            }
        } catch (e) {
            console.error("Erro OSRM:", e);
        }
    };

    const toggleUnitSelection = (unit) => {
        let updated;
        if (selectedUnits.find(u => u._id === unit._id)) {
            updated = selectedUnits.filter(u => u._id !== unit._id);
        } else {
            updated = [...selectedUnits, unit];
        }
        setSelectedUnits(updated);
        localStorage.setItem('logistics_draft_units', JSON.stringify(updated));
        calculateOSRMRoute(updated, extraStops);
    };

    const handleAddExtraStop = () => {
        const name = prompt("Nome da Parada Extra (ex: Posto, Almoço):");
        if (!name) return;

        // Simulação de parada no centro do mapa ou próximo (num app real usaria SearchBox)
        const newStop = {
            id: Date.now(),
            name,
            location: {
                lat: userLocation ? userLocation.location.lat + (Math.random() * 0.01) : -23.55,
                lng: userLocation ? userLocation.location.lng + (Math.random() * 0.01) : -46.63
            },
            isExtra: true
        };
        const updated = [...extraStops, newStop];
        setExtraStops(updated);
        calculateOSRMRoute(selectedUnits, updated);
    };

    const removeExtraStop = (id) => {
        const updated = extraStops.filter(s => s.id !== id);
        setExtraStops(updated);
        calculateOSRMRoute(selectedUnits, updated);
    };

    const [errorModal, setErrorModal] = useState(null);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOdometerPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartRoute = async () => {
        if (selectedUnits.length === 0) {
            setErrorModal("Selecione pelo menos uma unidade para o roteiro.");
            return;
        }
        if (!kmValue) {
            setErrorModal("Informe o KM Inicial do veículo.");
            return;
        }
        if (!odometerPhoto) {
            setErrorModal("A foto do painel (hodômetro) é obrigatória para auditoria.");
            return;
        }

        try {
            const plan = await LogisticsService.planDay({
                units: selectedUnits.map((u, idx) => ({ unitId: u._id, order: idx + 1 })),
                startLocation: userLocation,
                extraStops: extraStops
            });
            const started = await LogisticsService.startRoute(plan._id, parseFloat(kmValue.toString().replace(',', '.')), odometerPhoto);
            setActivePlan(started);
            setView('active');
            localStorage.setItem('active_route_plan', JSON.stringify(started));
        } catch (error) {
            setErrorModal("Falha ao iniciar rota no servidor: " + error.message);
        }
    };

    const handleCheckIn = () => {
        if (!navigator.geolocation) return;
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const target = selectedUnits[0];
                const dist = haversineDistance(latitude, longitude, target.location.lat, target.location.lng);

                if (dist <= 100) {
                    alert('Check-in Validado! #viagem_iniciada');
                    // Aqui chamaria o LogisticsService.checkIn
                } else {
                    alert(`Fora do raio: você está a ${Math.round(dist)}m. O limite é 100m.`);
                }
                setLoading(false);
            },
            () => { alert('Erro ao obter GPS'); setLoading(false); },
            { enableHighAccuracy: true }
        );
    };

    const handleExternalNav = () => {
        const target = selectedUnits[0];
        if (!target) return;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${target.location.lat},${target.location.lng}`, '_blank');
    };

    const handleRegisterToll = async () => {
        const val = prompt("Valor do Pedágio:");
        if (val) {
            try {
                await LogisticsService.registerToll(activePlan._id, parseFloat(val), 'url_recibo');
                setTolls([...tolls, { value: parseFloat(val), id: Date.now() }]);
            } catch (e) {
                alert("Erro ao registrar pedágio");
            }
        }
    };

    const handleFinishRoute = async () => {
        const finalKm = prompt("KM Final:");
        if (finalKm) {
            try {
                const finished = await LogisticsService.finishDay(activePlan._id, parseFloat(finalKm), 'url_foto_final');
                setActivePlan(finished);
                setView('summary');
                localStorage.removeItem('active_route_plan');
                localStorage.removeItem('logistics_draft_units');
            } catch (e) {
                alert("Erro ao finalizar: " + e.message);
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Navigation size={36} className="text-blue-600" />
                        Auditoria & Logística
                    </h1>
                    <p className="text-slate-500 font-medium">Otimização de rota e controle de despesas georreferenciado.</p>
                </div>
                {view === 'planning' && (
                    <div className="bg-blue-50 px-6 py-3 rounded-2xl flex items-center gap-4 border border-blue-100">
                        <div className="text-right">
                            <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest">Taxa Reembolso</span>
                            <span className="text-blue-700 font-black">R$ 0,45 / KM</span>
                        </div>
                        <CreditCard className="text-blue-600" />
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Lado Esquerdo: Painel de Controle */}
                <div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-4 space-y-6">
                    {view === 'planning' && (
                        <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 sm:space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-xl text-slate-600"><RouteIcon size={20} /></div>
                                    Planejar Roteiro
                                </h3>

                                <div className="space-y-4">
                                    {/* Ponto de Partida */}
                                    <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-slate-900/10">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-500 p-2 rounded-xl"><MapPin size={18} /></div>
                                            <div>
                                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Ponto de Partida</p>
                                                <p className="font-bold text-sm">{userLocation ? 'Minha Localização (GPS)' : 'Detectando GPS...'}</p>
                                            </div>
                                        </div>
                                        {userLocation && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                                    </div>

                                    {/* Paradas */}
                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedUnits.map((u, idx) => (
                                            <div key={u._id} className="flex items-center gap-2 group">
                                                <div className="flex-1 flex items-center justify-between p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/50 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{u.type}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => toggleUnitSelection(u)} className="text-blue-200 hover:text-red-500 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {extraStops.map((s, idx) => (
                                            <div key={s.id} className="flex items-center gap-2 group">
                                                <div className="flex-1 flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                                                            {selectedUnits.length + idx + 1}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-slate-800 leading-tight">{s.name}</p>
                                                            <p className="text-[10px] text-orange-400 font-bold uppercase trekking-tighter">Parada Extra</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => removeExtraStop(s.id)} className="text-orange-200 hover:text-red-500 transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAddExtraStop}
                                        className="w-full border-2 border-dashed border-slate-200 p-4 rounded-2xl text-slate-400 font-bold hover:border-orange-300 hover:text-orange-500 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Plus size={18} /> Adicionar Parada Extra
                                    </button>
                                </div>
                            </div>

                            {/* Unidades Disponíveis */}
                            <div className="pt-6 border-t border-slate-50">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Selecionar Unidades UAN</h4>
                                <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                    {units.filter(u => !selectedUnits.find(s => s._id === u._id)).length === 0 && (
                                        <p className="text-center py-4 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            {units.length === 0 ? 'Nenhuma unidade encontrada.' : 'Todas as unidades já foram selecionadas.'}
                                        </p>
                                    )}
                                    {units.filter(u => !selectedUnits.find(s => s._id === u._id)).map(unit => (
                                        <button
                                            key={unit._id}
                                            onClick={() => toggleUnitSelection(unit)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-400 flex items-center justify-center">
                                                    <Plus size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{unit.name}</p>
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">{unit.type || 'Unidade'}</p>
                                                </div>
                                            </div>
                                            {!unit.location && <span className="text-[8px] text-orange-400 font-bold uppercase">Sem GPS</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Odometer & Start */}
                            <div className="pt-6 border-t border-slate-50 space-y-6">
                                <div className="flex flex-col xl:grid xl:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={kmValue}
                                            onChange={e => {
                                                const val = e.target.value.replace(',', '.');
                                                if (/^\d*\.?\d*$/.test(val)) {
                                                    setKmValue(e.target.value); // Manter o que o usuário digita (incluindo vírgula pra exibição)
                                                }
                                            }}
                                            placeholder="KM Inicial"
                                            className="w-full pl-12 pr-4 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-black text-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <label className={`
                                            flex items-center justify-center h-[68px] pl-10 pr-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all overflow-hidden relative
                                            ${odometerPhoto ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100/50'}
                                        `}>
                                            {odometerPhoto ? (
                                                <img src={odometerPhoto} alt="Odometer" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                            ) : null}
                                            <span className="text-xs font-black uppercase tracking-tight relative z-10 w-full text-center">
                                                {odometerPhoto ? 'Alterar Foto' : 'Foto Odômetro'}
                                            </span>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                                            {odometerPhoto && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20">
                                                    <CheckCircle2 size={10} className="text-white" />
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStartRoute}
                                    className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                                >
                                    <Play size={20} />
                                    Iniciar Roteiro Auditável
                                </button>
                            </div>
                        </div>
                    )}

                    {view === 'active' && (
                        <div className="space-y-6">
                            {/* Card de Unidade Atual */}
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <RouteIcon size={120} />
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-4 inline-block">Destino Atual</span>
                                    <h2 className="text-3xl font-black mb-1">{selectedUnits[0]?.name}</h2>
                                    <p className="text-slate-400 font-medium mb-8">Raio de Geofencing: 100m</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            className="bg-white text-slate-900 font-black py-4 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                            onClick={handleExternalNav}
                                        >
                                            <Navigation size={18} /> Navegar
                                        </button>
                                        <button
                                            className="bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                            onClick={handleCheckIn}
                                        >
                                            Check-in
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Controle de Pedágios */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="bg-orange-50 p-2 rounded-xl text-orange-600"><CreditCard size={20} /></div>
                                    Custos em Trânsito
                                </h3>
                                <div className="space-y-4">
                                    {tolls.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CheckCircle2 size={16} /></div>
                                                <span className="font-bold text-slate-700">R$ {t.value.toFixed(2)}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">#pedagio</span>
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleRegisterToll}
                                        className="w-full border-2 border-dashed border-slate-200 p-4 rounded-2xl text-slate-400 font-bold hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Plus size={18} /> Registrar Pedágio
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleFinishRoute}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                            >
                                <Flag size={20} /> Encerrar o Dia (Check-out)
                            </button>
                        </div>
                    )}
                </div>

                {/* Lado Direito: Mapa e Rota */}
                <div className="lg:col-span-7 xl:col-span-8 h-[500px] lg:h-[calc(100vh-250px)] min-h-[500px] max-h-[800px] order-1 lg:order-2">
                    <div className="bg-white p-2 rounded-[3rem] border border-slate-100 shadow-xl h-full overflow-hidden relative group">
                        <MapContainer
                            center={selectedUnits.length > 0 ? [(selectedUnits[0].location.lat ?? selectedUnits[0].location.latitude), (selectedUnits[0].location.lng ?? selectedUnits[0].location.longitude)] : [-23.5505, -46.6333]}
                            zoom={13}
                            style={{ height: '100%', width: '100%', borderRadius: '2.5rem' }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                            {userLocation && (
                                <Marker position={[userLocation.location.lat, userLocation.location.lng]} icon={createNumberedIcon('S', '#10b981')}>
                                    <Popup><div className="font-bold">Partida (Meu Local)</div></Popup>
                                </Marker>
                            )}

                            {selectedUnits.map((u, idx) => (
                                u.location && (
                                    <Marker
                                        key={u._id}
                                        position={[(u.location.lat ?? u.location.latitude), (u.location.lng ?? u.location.longitude)]}
                                        icon={createNumberedIcon(idx + 1, view === 'active' && idx === 0 ? '#ef4444' : '#3b82f6')}
                                    >
                                        <Popup>
                                            <div className="p-2">
                                                <p className="font-bold border-b pb-1 mb-1">{u.name}</p>
                                                <p className="text-xs text-slate-500 italic">Clique em check-in para iniciar</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            ))}

                            {extraStops.map((s, idx) => (
                                <Marker
                                    key={s.id}
                                    position={[s.location.lat, s.location.lng]}
                                    icon={createNumberedIcon(selectedUnits.length + idx + 1, '#f97316')}
                                >
                                    <Popup><div className="font-bold">{s.name}</div></Popup>
                                </Marker>
                            ))}
                            {routeData && (
                                <Polyline
                                    positions={routeData.geometry.coordinates.map(c => [c[1], c[0]])}
                                    color="#3b82f6"
                                    weight={5}
                                    opacity={0.6}
                                />
                            )}
                        </MapContainer>

                        {/* Route Info Overlay */}
                        {routeData && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="absolute top-8 right-8 bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-100 shadow-2xl z-[1000] w-48"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Tempo Est. (OSRM)</span>
                                        <span className="text-xl font-black text-slate-900">{Math.round(routeData.duration / 60)} min</span>
                                    </div>
                                    <div className="h-px bg-slate-200"></div>
                                    <div>
                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Distância Real</span>
                                        <span className="text-xl font-black text-slate-900">{(routeData.distance / 1000).toFixed(1)} km</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {errorModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4"
                        onClick={() => setErrorModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 text-center shadow-2xl border border-slate-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-red-500 mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Ops! Falta algo</h3>
                            <p className="text-slate-500 text-lg font-medium mb-8 leading-relaxed">
                                {errorModal}
                            </p>
                            <button
                                onClick={() => setErrorModal(null)}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all"
                            >
                                Entendi, vou ajustar
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {view === 'summary' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white w-full max-w-lg rounded-[3rem] p-10 text-center shadow-2xl"
                        >
                            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Relatório de Viagem</h2>
                            <p className="text-slate-500 font-medium mb-8">Dia encerrado com sucesso. Resumo auditado:</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-6 rounded-3xl">
                                    <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Total KM</span>
                                    <span className="text-2xl font-black text-slate-900">60.0 km</span>
                                </div>
                                <div className="bg-blue-600 p-6 rounded-3xl text-white">
                                    <span className="block text-[10px] font-black text-blue-200 uppercase mb-1">Reembolso</span>
                                    <span className="text-2xl font-black">R$ 42,50</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setView('planning')}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <History size={18} /> Voltar ao Início
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
};

export default VisitRoutePage;
