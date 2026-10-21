/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { FireStation, MaterialOperacional, SgbId } from '../types';
import { OFFICIAL_SGBS } from '../data/initialData';
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
} from 'lucide-react';

interface OperationalMapProps {
  stations: FireStation[];
  materials: MaterialOperacional[];
  onSelectStationFilter: (stationId: string) => void;
}

export const OperationalMap: React.FC<OperationalMapProps> = ({
  stations,
  materials,
  onSelectStationFilter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedStation, setSelectedStation] = useState<FireStation | null>(
    stations.find((s) => s.id === 'eb-sao-vicente') || stations[0] || null
  );
  const [activeSgbView, setActiveSgbView] = useState<string>('ALL');
  const [mapEngine, setMapEngine] = useState<'google' | 'tactical'>('google');

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

  // Initialize tactical Leaflet map if engine is 'tactical'
  useEffect(() => {
    if (mapEngine !== 'tactical' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [-24.1, -46.8],
        zoom: 9,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add Markers for stations
      stations.forEach((st) => {
        const stats = stationStats.find((s) => s.station.id === st.id);
        const readiness = stats?.readiness || 100;
        const operando = stats?.operando || 0;
        const total = stats?.total || 0;

        const markerColor =
          readiness >= 85 ? '#10b981' : readiness >= 65 ? '#f59e0b' : '#ef4444';

        const customIcon = L.divIcon({
          className: 'custom-fire-marker',
          html: `
            <div style="
              background: #0f172a;
              border: 2px solid ${markerColor};
              color: white;
              border-radius: 9999px;
              padding: 3px 8px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              white-space: nowrap;
            ">
              <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${markerColor};"></span>
              <span>${st.nome}</span>
              <span style="background:${markerColor}33; color:${markerColor}; font-size:10px; padding:1px 3px; border-radius:3px;">
                ${operando}/${total}
              </span>
            </div>
          `,
          iconSize: [110, 26],
          iconAnchor: [55, 13],
        });

        const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedStation(st);
          map.panTo([st.lat, st.lng]);
        });
      });

      // Recalculate size after container settles
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      return () => {
        clearTimeout(timer);
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (e) {
      console.warn('Leaflet map initialization skipped or not available', e);
    }
  }, [mapEngine, stations]);

  const focusOnSgb = (sgb: string) => {
    setActiveSgbView(sgb);
    if (sgb === 'ALL') {
      const firstSt = stations[0];
      if (firstSt) setSelectedStation(firstSt);
    } else {
      const sgbSt = stations.find((s) => s.sgb === sgb);
      if (sgbSt) setSelectedStation(sgbSt);
    }

    if (mapInstanceRef.current) {
      if (sgb === '1° SGB') {
        mapInstanceRef.current.setView([-23.955, -46.33], 12);
      } else if (sgb === '2° SGB') {
        mapInstanceRef.current.setView([-23.92, -46.28], 11);
      } else if (sgb === '3° SGB') {
        mapInstanceRef.current.setView([-24.05, -46.6], 10);
      } else if (sgb === '4° SGB') {
        mapInstanceRef.current.setView([-24.6, -47.8], 9);
      } else {
        mapInstanceRef.current.setView([-24.1, -46.8], 9);
      }
    }
  };

  const activeStats = selectedStation
    ? stationStats.find((s) => s.station.id === selectedStation.id)
    : null;

  // Filter stations shown in selector
  const visibleStations = stations.filter((s) => {
    if (activeSgbView === 'ALL') return true;
    return s.sgb === activeSgbView;
  });

  // Google Maps Search Query for the selected station
  const googleMapsSearchUrl = selectedStation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `Corpo de Bombeiros ${selectedStation.nome}, ${selectedStation.endereco}`
      )}`
    : 'https://maps.google.com';

  const googleMapsEmbedUrl = selectedStation
    ? `https://maps.google.com/maps?q=${encodeURIComponent(
        `Corpo de Bombeiros ${selectedStation.nome}, ${selectedStation.endereco}`
      )}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : '';

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-white">
            Mapa Geral Operacional e Localização (6° GB)
          </span>
          <span className="text-[11px] text-slate-400">({stations.length} Quartéis)</span>
        </div>

        {/* Engine switcher & SGB buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Map Type Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setMapEngine('google')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                mapEngine === 'google'
                  ? 'bg-red-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => setMapEngine('tactical')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                mapEngine === 'tactical'
                  ? 'bg-red-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visão Tática 19 Postos</span>
            </button>
          </div>

          {/* Quick SGB zoom buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => focusOnSgb('ALL')}
              className={`px-2 py-1 rounded font-medium transition ${
                activeSgbView === 'ALL'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Todos (6° GB)
            </button>
            {OFFICIAL_SGBS.map((sgb) => (
              <button
                key={sgb}
                onClick={() => focusOnSgb(sgb)}
                className={`px-2 py-1 rounded font-medium transition ${
                  activeSgbView === sgb
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {sgb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Map on Left, Station Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Map Container */}
        <div className="lg:col-span-2 h-[560px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative shadow-inner flex flex-col">
          {mapEngine === 'google' ? (
            <div className="relative w-full h-full flex flex-col">
              {/* Google Maps Embed Banner */}
              <div className="bg-slate-900/90 backdrop-blur px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs z-10">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-white truncate">
                    {selectedStation ? `Posto ${selectedStation.nome}` : 'Selecione um posto'}
                  </span>
                  <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                    • {selectedStation?.endereco}
                  </span>
                </div>
                {selectedStation && (
                  <a
                    href={googleMapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded font-medium transition shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir no Google Maps ↗</span>
                  </a>
                )}
              </div>

              {/* Iframe displaying Google Maps location */}
              {selectedStation && googleMapsEmbedUrl ? (
                <iframe
                  title={`Google Maps - Posto ${selectedStation.nome}`}
                  src={googleMapsEmbedUrl}
                  className="w-full flex-1 border-0"
                  loading="lazy"
                  allowFullScreen
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  Selecione um posto de bombeiros ao lado para carregar o mapa.
                </div>
              )}
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          )}
        </div>

        {/* Station Detail Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3 max-h-[560px] overflow-y-auto">
          {selectedStation && activeStats ? (
            <div className="space-y-3">
              <div className="border-b border-slate-800 pb-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
                    {selectedStation.sgb}
                  </span>
                  <span className="text-xs text-slate-400">{selectedStation.cidade} - SP</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  POSTO {selectedStation.nome}
                </h3>
                <p className="text-xs text-slate-300 mt-1 flex items-start gap-1.5 leading-snug">
                  <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span>{selectedStation.endereco}</span>
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium py-1.5 px-2.5 rounded-lg text-xs transition border border-slate-700"
                >
                  <Navigation className="w-3 h-3 text-blue-400" />
                  <span>Google Maps ↗</span>
                </a>
                <button
                  onClick={() => onSelectStationFilter(selectedStation.id)}
                  className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-medium py-1.5 px-2.5 rounded-lg text-xs transition shadow"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ver Carga ({activeStats.total})</span>
                </button>
              </div>

              {/* Readiness Progress */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">Índice de Prontidão</span>
                  <span className="font-bold text-emerald-400">
                    {activeStats.readiness}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${activeStats.readiness}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center text-xs">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <div className="text-emerald-400 font-bold">{activeStats.operando}</div>
                    <div className="text-[9px] text-slate-400">Operando</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <div className="text-amber-400 font-bold">{activeStats.emManutencao}</div>
                    <div className="text-[9px] text-slate-400">Manutenção</div>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <div className="text-red-400 font-bold">{activeStats.baixado}</div>
                    <div className="text-[9px] text-slate-400">Baixados</div>
                  </div>
                </div>
              </div>

              {/* Station Details */}
              <div className="space-y-1.5 text-xs bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-400">Comandante:</span>
                  <span className="font-medium text-slate-200">
                    {selectedStation.comandante || 'A designar'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-400">Telefone:</span>
                  <span className="font-medium text-slate-200">{selectedStation.telefone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-400">Gmail do Posto:</span>
                  <span className="font-mono text-amber-300 text-[11px] truncate">
                    {selectedStation.emailPosto}
                  </span>
                </div>
              </div>

              {/* Materials preview snippet */}
              <div>
                <div className="text-[11px] font-semibold text-slate-300 mb-1">
                  Materiais do Posto ({activeStats.materials.length}):
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {activeStats.materials.map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-950 p-1.5 rounded text-xs border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-slate-200 truncate">{m.tipo}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.categoria} • {m.patrimonio}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                          m.status === 'OPERANDO'
                            ? 'bg-emerald-950 text-emerald-300'
                            : m.status === 'BAIXADO'
                            ? 'bg-red-950 text-red-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              Clique em um posto para ver os dados.
            </div>
          )}

          {/* Station Quick Switcher List */}
          <div className="border-t border-slate-800 pt-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Selecionar Quartel ({visibleStations.length} postos):
            </span>
            <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-1">
              {visibleStations.map((st) => {
                const isSelected = selectedStation?.id === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedStation(st);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo([st.lat, st.lng]);
                      }
                    }}
                    className={`text-left p-1.5 rounded text-xs transition border ${
                      isSelected
                        ? 'bg-red-950/80 border-red-600 text-white font-bold'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate text-[11px]">{st.nome}</div>
                    <div className="text-[9px] text-slate-500 truncate">{st.sgb}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
