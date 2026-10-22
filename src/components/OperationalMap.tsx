/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { FireStation, MaterialOperacional, SgbId, Usuario } from '../types';
import { OFFICIAL_SGBS } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import {
  MapPin,
  Mail,
  User,
  ExternalLink,
  Building2,
  Phone,
  Layers,
  Compass,
  Navigation,
  Shield,
  Radio,
  Flame,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface OperationalMapProps {
  stations: FireStation[];
  materials: MaterialOperacional[];
  onSelectStationFilter: (stationId: string) => void;
  focusedStationId?: string | null;
}

export const OperationalMap: React.FC<OperationalMapProps> = ({
  stations,
  materials,
  onSelectStationFilter,
  focusedStationId,
}) => {
  const { availableUsers } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const [selectedStation, setSelectedStation] = useState<FireStation | null>(() => {
    if (focusedStationId) {
      const found = stations.find((s) => s.id === focusedStationId);
      if (found) return found;
    }
    return stations.find((s) => s.id === 'eb-sao-vicente') || stations[0] || null;
  });

  const [activeSgbView, setActiveSgbView] = useState<string>('ALL');
  const [mapStyle, setMapStyle] = useState<'voyager' | 'osm' | 'satellite'>('voyager');

  // Helper to derive commanders from authorized users
  const getSgbCommander = (sgbId: SgbId) => {
    const sgbUser = availableUsers.find(
      (u) => u.nivelAcesso === 'GESTOR_SGB' && u.sgbAutorizado === sgbId && u.ativo
    );
    return sgbUser ? `${sgbUser.postoGraduacao} ${sgbUser.nome}` : `Comando do ${sgbId}`;
  };

  const getStationCommander = (station: FireStation) => {
    const postUser = availableUsers.find(
      (u) =>
        u.nivelAcesso === 'OPERADOR_POSTO' &&
        (u.estacaoAutorizadaId === station.id ||
          u.email.toLowerCase() === station.emailPosto.toLowerCase()) &&
        u.ativo
    );
    return postUser ? `${postUser.postoGraduacao} ${postUser.nome}` : station.comandante || 'A designar';
  };

  // Calculate stats for each station
  const stationStats = stations.map((st) => {
    const stationMaterials = materials.filter(
      (m) => m.estacaoId === st.id || m.estacao === st.nome
    );
    const total = stationMaterials.length;
    const operando = stationMaterials.filter((m) => m.status === 'OPERANDO').length;
    const baixado = stationMaterials.filter((m) => m.status === 'BAIXADO').length;
    const emManutencao = stationMaterials.filter((m) => m.status === 'EM MANUTENÇÃO').length;
    const readiness = total > 0 ? Math.round((operando / total) * 100) : 100;

    return {
      station: st,
      total,
      operando,
      baixado,
      emManutencao,
      readiness,
      materials: stationMaterials,
    };
  });

  // Function to generate the custom SVG Fire Truck HTML for Leaflet DivIcon
  const createFireTruckIcon = (
    station: FireStation,
    readiness: number,
    isSelected: boolean
  ) => {
    const statusColor =
      readiness >= 85 ? '#10B981' : readiness >= 60 ? '#F59E0B' : '#EF4444';

    return L.divIcon({
      className: 'fire-engine-marker',
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; transform: ${
          isSelected ? 'scale(1.18)' : 'scale(1)'
        }; transition: all 0.2s ease;">
          ${
            isSelected
              ? `<div style="position:absolute; top:-4px; left:50%; transform:translateX(-50%); width:54px; height:34px; background:rgba(239,68,68,0.4); border-radius:12px; filter:blur(4px); z-index:0; animation:pulse 1.5s infinite;"></div>`
              : ''
          }
          
          <!-- Fire Engine Truck SVG -->
          <div style="position:relative; z-index:1; background:#020617; border:2px solid ${
            isSelected ? '#EF4444' : '#334155'
          }; border-radius:10px; padding:4px 6px; box-shadow:0 8px 18px rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center;">
            <svg width="34" height="24" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Truck Chassis Main Body -->
              <path d="M4 20C4 16.6863 6.68629 14 10 14H38V38H4V20Z" fill="#DC2626"/>
              <!-- Cab Front -->
              <path d="M38 16H52L58 25V38H38V16Z" fill="#B91C1C"/>
              <!-- Windshield -->
              <path d="M40 18H50L54 25H40V18Z" fill="#93C5FD"/>
              <!-- Roof Rescue Ladder -->
              <rect x="10" y="8" width="28" height="4" rx="1" fill="#F1F5F9" stroke="#334155" stroke-width="1.2"/>
              <line x1="16" y1="8" x2="16" y2="12" stroke="#334155" stroke-width="1.2"/>
              <line x1="24" y1="8" x2="24" y2="12" stroke="#334155" stroke-width="1.2"/>
              <line x1="32" y1="8" x2="32" y2="12" stroke="#334155" stroke-width="1.2"/>
              <!-- Emergency Blue Flashing Strobe -->
              <circle cx="44" cy="13" r="3.5" fill="#3B82F6"/>
              <circle cx="44" cy="13" r="5.5" fill="#60A5FA" opacity="0.6"/>
              <!-- Yellow Fluorescent Side Stripe -->
              <rect x="4" y="27" width="54" height="3" fill="#FEF08A"/>
              <!-- Headlight -->
              <rect x="56" y="29" width="2" height="4" rx="1" fill="#FDE047"/>
              <!-- Wheels -->
              <circle cx="16" cy="38" r="6" fill="#0F172A" stroke="#94A3B8" stroke-width="2"/>
              <circle cx="16" cy="38" r="2.5" fill="#E2E8F0"/>
              <circle cx="48" cy="38" r="6" fill="#0F172A" stroke="#94A3B8" stroke-width="2"/>
              <circle cx="48" cy="38" r="2.5" fill="#E2E8F0"/>
            </svg>
          </div>

          <!-- Station Label Badge -->
          <div style="
            margin-top:2px;
            background:#090d16;
            border:1px solid ${isSelected ? '#EF4444' : '#334155'};
            color:#F8FAFC;
            padding:2px 6px;
            border-radius:6px;
            font-size:9.5px;
            font-weight:700;
            white-space:nowrap;
            box-shadow:0 4px 8px rgba(0,0,0,0.5);
            display:flex;
            align-items:center;
            gap:4px;
            font-family:sans-serif;
          ">
            <span style="width:6px; height:6px; border-radius:50%; background:${statusColor};"></span>
            <span>${station.nome}</span>
            <span style="color:${statusColor}; font-weight:800; font-size:8.5px;">${readiness}%</span>
          </div>
        </div>
      `,
      iconSize: [60, 48],
      iconAnchor: [30, 24],
      popupAnchor: [0, -26],
    });
  };

  // Initialize and maintain the Leaflet map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-24.1, -46.7],
        zoom: 9,
        zoomControl: true,
      });

      // Default high quality CartoDB tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Render Markers with Fire Engine icons
    stations.forEach((st) => {
      const stats = stationStats.find((s) => s.station.id === st.id);
      const readiness = stats?.readiness || 100;
      const isSelected = selectedStation?.id === st.id;

      const icon = createFireTruckIcon(st, readiness, isSelected);
      const marker = L.marker([st.lat, st.lng], { icon }).addTo(map);

      // Popup with station details
      const sgbCmd = getSgbCommander(st.sgb);
      const postCmd = getStationCommander(st);

      const popupContent = `
        <div style="font-family:sans-serif; padding:4px; min-width:200px; color:#0f172a;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:16px;">🚒</span>
            <strong style="font-size:13px; color:#b91c1c;">POSTO ${st.nome}</strong>
          </div>
          <div style="font-size:11px; color:#475569; margin-bottom:6px; line-height:1.3;">
            ${st.endereco}
          </div>
          <div style="background:#f1f5f9; padding:5px 8px; border-radius:6px; font-size:10.5px; margin-bottom:6px;">
            <div><strong>🛡️ Cmt ${st.sgb}:</strong> ${sgbCmd}</div>
            <div><strong>👨‍✈️ Cmt Posto:</strong> ${postCmd}</div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700;">
            <span style="color:#10b981;">Prontidão: ${readiness}%</span>
            <span style="color:#475569;">${stats?.operando || 0} materiais</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedStation(st);
        map.panTo([st.lat, st.lng]);
      });

      markersRef.current[st.id] = marker;
    });

    // Ensure map measures container dimensions correctly
    const invalidateTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const invalidateTimer2 = setTimeout(() => {
      map.invalidateSize();
    }, 450);

    return () => {
      clearTimeout(invalidateTimer);
      clearTimeout(invalidateTimer2);
    };
  }, [stations, materials, mapStyle, selectedStation?.id]);

  // When focusedStationId changes (e.g. from Postos tab)
  useEffect(() => {
    if (focusedStationId) {
      const st = stations.find((s) => s.id === focusedStationId);
      if (st) {
        setSelectedStation(st);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([st.lat, st.lng], 13);
          const marker = markersRef.current[st.id];
          if (marker) {
            marker.openPopup();
          }
        }
      }
    }
  }, [focusedStationId, stations]);

  const focusOnSgb = (sgb: string) => {
    setActiveSgbView(sgb);
    if (!mapInstanceRef.current) return;

    if (sgb === 'ALL') {
      mapInstanceRef.current.setView([-24.1, -46.7], 9);
      const first = stations[0];
      if (first) setSelectedStation(first);
    } else {
      const sgbStations = stations.filter((s) => s.sgb === sgb);
      const first = sgbStations[0];
      if (first) {
        setSelectedStation(first);
        if (sgb === '1° SGB') {
          mapInstanceRef.current.setView([-23.955, -46.33], 12);
        } else if (sgb === '2° SGB') {
          mapInstanceRef.current.setView([-23.92, -46.28], 11);
        } else if (sgb === '3° SGB') {
          mapInstanceRef.current.setView([-24.08, -46.65], 10);
        } else if (sgb === '4° SGB') {
          mapInstanceRef.current.setView([-24.6, -47.8], 9);
        }
      }
    }
  };

  const activeStats = selectedStation
    ? stationStats.find((s) => s.station.id === selectedStation.id)
    : null;

  // Google Maps Search Query for the selected station
  const googleMapsSearchUrl = selectedStation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `Corpo de Bombeiros ${selectedStation.nome}, ${selectedStation.endereco}`
      )}`
    : 'https://maps.google.com';

  const wazeUrl = selectedStation
    ? `https://waze.com/ul?ll=${selectedStation.lat},${selectedStation.lng}&navigate=yes`
    : '#';

  return (
    <div className="space-y-3">
      {/* Top Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Visão Tática e Localização dos 19 Quartéis
              </span>
              <span className="text-[10px] bg-red-950 text-red-300 font-mono font-bold px-2 py-0.5 rounded border border-red-800/50">
                6° GB
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Quartéis representados com caminhões de bombeiros (🚒) e indicadores de prontidão operacional.
            </p>
          </div>
        </div>

        {/* SGB Zoom Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => focusOnSgb('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeSgbView === 'ALL'
                ? 'bg-red-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({stations.length})
          </button>
          {OFFICIAL_SGBS.map((sgb) => (
            <button
              key={sgb}
              onClick={() => focusOnSgb(sgb)}
              className={`px-2.5 py-1 rounded font-medium transition ${
                activeSgbView === sgb
                  ? 'bg-red-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sgb}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Station Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Interactive Leaflet Map (Always Open & Responsive) */}
        <div className="lg:col-span-2 h-[580px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl flex flex-col">
          {/* Sub-header info bar inside map */}
          <div className="bg-slate-900/90 backdrop-blur px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs z-10 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-bold text-white truncate flex items-center gap-1.5">
                <span>🚒</span>
                <span>
                  {selectedStation ? `Posto ${selectedStation.nome}` : 'Clique em um caminhão no mapa'}
                </span>
              </span>
              <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                • {selectedStation?.cidade} ({selectedStation?.sgb})
              </span>
            </div>

            {selectedStation && (
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2 py-0.5 rounded font-medium transition border border-slate-700"
                  title="Abrir endereço no Google Maps"
                >
                  <ExternalLink className="w-3 h-3 text-red-400" />
                  <span className="hidden sm:inline">Google Maps ↗</span>
                </a>
              </div>
            )}
          </div>

          {/* Leaflet DOM container */}
          <div
            ref={mapContainerRef}
            className="w-full flex-1 z-0 bg-slate-950"
            style={{ minHeight: '520px' }}
          />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/95 border border-slate-700/80 rounded-lg p-2 text-[10px] text-slate-300 shadow-xl backdrop-blur flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>≥85% Operando</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>60-84%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>&lt;60% Crítico</span>
            </div>
          </div>
        </div>

        {/* Station Detail Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 max-h-[580px] overflow-y-auto shadow-xl">
          {selectedStation && activeStats ? (
            <div className="space-y-3 text-xs">
              {/* Header of selected station */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
                    {selectedStation.sgb} • 6° GB
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{selectedStation.cidade} - SP</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                  <span>POSTO {selectedStation.nome}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 flex items-start gap-1.5 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span>{selectedStation.endereco}</span>
                </p>
              </div>

              {/* Navigation & GPS Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-1.5 px-2 rounded-lg text-xs transition border border-slate-700"
                >
                  <Navigation className="w-3 h-3 text-red-400" />
                  <span>Google Maps ↗</span>
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-1.5 px-2 rounded-lg text-xs transition border border-slate-700"
                >
                  <Navigation className="w-3 h-3 text-blue-400" />
                  <span>Waze ↗</span>
                </a>
              </div>

              {/* Automatic Commanders Linked from Accesses */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cmt {selectedStation.sgb}:</span>
                  </span>
                  <span className="font-semibold text-blue-300">
                    {getSgbCommander(selectedStation.sgb)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cmt / Encarregado:</span>
                  </span>
                  <span className="font-semibold text-emerald-300">
                    {getStationCommander(selectedStation)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>Gmail Posto:</span>
                  </span>
                  <span className="font-mono text-amber-300 truncate max-w-[170px]">
                    {selectedStation.emailPosto}
                  </span>
                </div>

                {selectedStation.telefone && (
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>Telefone:</span>
                    </span>
                    <span className="text-slate-200 font-mono">
                      {selectedStation.telefone}
                    </span>
                  </div>
                )}
              </div>

              {/* Readiness Bar */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Índice de Prontidão</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {activeStats.readiness}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      activeStats.readiness >= 85
                        ? 'bg-emerald-500'
                        : activeStats.readiness >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${activeStats.readiness}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px]">
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-emerald-400 font-bold">{activeStats.operando}</div>
                    <div className="text-[10px] text-slate-400">Operando</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-red-400 font-bold">{activeStats.baixado}</div>
                    <div className="text-[10px] text-slate-400">Baixados</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <div className="text-slate-200 font-bold">{activeStats.total}</div>
                    <div className="text-[10px] text-slate-400">Total Carga</div>
                  </div>
                </div>
              </div>

              {/* Quick Link to Materials */}
              <button
                onClick={() => onSelectStationFilter(selectedStation.id)}
                className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-xs transition shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Todos os Materiais de {selectedStation.nome}</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6">
              <Building2 className="w-12 h-12 text-slate-700 mb-2" />
              <p>Clique em um caminhão de bombeiro no mapa para visualizar a carga e o comando do posto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
