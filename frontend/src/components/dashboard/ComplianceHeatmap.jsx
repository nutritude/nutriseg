import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ComplianceHeatmap = ({ units }) => {
    // units: [{ name: 'Unidade X', lat: -23.5, lng: -46.6, ics: 85 }]
    const center = [-23.5505, -46.6333]; // São Paulo default

    const getColor = (ics) => {
        if (ics >= 90) return '#10b981'; // Verde
        if (ics >= 70) return '#f59e0b'; // Amarelo
        return '#ef4444'; // Vermelho
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Heatmap de Conformidade (ICS)</h3>
            <div className="h-[90%] rounded-xl overflow-hidden border border-slate-200">
                <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {units.map((unit, idx) => (
                        unit.lat && unit.lng && (
                            <CircleMarker
                                key={idx}
                                center={[unit.lat, unit.lng]}
                                radius={12}
                                pathOptions={{
                                    fillColor: getColor(unit.ics),
                                    color: 'white',
                                    weight: 2,
                                    fillOpacity: 0.8
                                }}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <b className="block border-b mb-1">{unit.name}</b>
                                        <span>ICS: <b style={{ color: getColor(unit.ics) }}>{unit.ics}%</b></span>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        )
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default ComplianceHeatmap;
