/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  ChevronDown,
  Sparkles,
  Loader2,
  X,
  Music,
} from 'lucide-react';

export interface RadioStation {
  id: string;
  name: string;
  frequency: string;
  city: string;
  genre: string;
  streamUrl: string;
  badgeColor: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'saudade-fm',
    name: 'Saudade FM',
    frequency: '99.7 FM',
    city: 'Santos / Baixada Santista',
    genre: 'Flashback, Pop e MPB',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SAUDADE_FMAAC.aac',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'radio-rock',
    name: '89 A Rádio Rock',
    frequency: '89.1 FM',
    city: 'São Paulo',
    genre: 'Rock Nacional & Internacional',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_ROCKAAC.aac',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  {
    id: 'alpha-fm',
    name: 'Alpha FM',
    frequency: '101.7 FM',
    city: 'São Paulo',
    genre: 'Músicas Leves & Contemporâneas',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_ALPHAFM_ADP.aac',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  {
    id: 'antena-1',
    name: 'Antena 1',
    frequency: '94.7 FM',
    city: 'São Paulo / Rede',
    genre: 'Pop Internacional Clássico',
    streamUrl: 'https://antenaone.crossradio.com.br/stream/1',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
];

export const OnlineRadioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState<RadioStation>(RADIO_STATIONS[0]);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sigma_radio_volume');
      return saved !== null ? Number(saved) : 0.7;
    } catch {
      return 0.7;
    }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    try {
      localStorage.setItem('sigma_radio_volume', String(volume));
    } catch {}
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      setHasError(false);
      try {
        audioRef.current.src = selectedRadio.streamUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio play error:', err);
        setHasError(true);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectStation = async (station: RadioStation) => {
    setSelectedRadio(station);
    setIsMenuOpen(false);
    setHasError(false);

    if (audioRef.current) {
      audioRef.current.src = station.streamUrl;
      audioRef.current.load();
      if (isPlaying) {
        setIsLoading(true);
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error('Station switch error:', err);
          setIsPlaying(false);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <div className="relative">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
          setHasError(true);
        }}
      />

      {/* Main Bar Widget */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-lg text-xs shadow-sm transition">
        {/* Play / Stop Button */}
        <button
          onClick={togglePlay}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition shadow ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
          }`}
          title={isPlaying ? 'Pausar Rádio' : `Ouvir ${selectedRadio.name}`}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-emerald-400" />
          )}
        </button>

        {/* Station Selector Trigger */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-1.5 text-left hover:text-white transition group py-0.5"
          title="Clique para escolher outra rádio online"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[11px] truncate max-w-[70px] sm:max-w-[110px]">
                {selectedRadio.name}
              </span>
              {isPlaying && (
                <span className="flex items-center gap-0.5 h-2.5">
                  <span className="w-0.5 h-2 bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-3 bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-1.5 bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
              <span className="text-amber-400 font-semibold">{selectedRadio.frequency}</span>
              <span className="hidden md:inline">• {selectedRadio.city.split('/')[0].trim()}</span>
            </div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition shrink-0" />
        </button>

        {/* Mute Toggle Icon */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1 text-slate-400 hover:text-slate-200 transition hidden sm:block"
          title={isMuted ? 'Desmutar' : 'Silenciar'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          ) : volume < 0.5 ? (
            <Volume1 className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Dropdown Menu with Station List & Volume Slider */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-1.5 w-72 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-red-500" />
              <span className="font-bold text-white text-xs">Rádio Online • Quartel</span>
            </div>
            <span className="text-[9px] bg-red-950 text-red-300 font-mono px-1.5 py-0.2 rounded border border-red-800/60 font-bold uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              Ao Vivo
            </span>
          </div>

          <p className="text-[10px] text-slate-400 mb-2.5 leading-relaxed">
            Áudio streaming nativo integrado para o expediente interno (sem anúncios do sistema).
          </p>

          {/* Station List */}
          <div className="space-y-1 mb-3">
            {RADIO_STATIONS.map((station) => {
              const isSelected = selectedRadio.id === station.id;
              return (
                <button
                  key={station.id}
                  onClick={() => handleSelectStation(station)}
                  className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between border ${
                    isSelected
                      ? 'bg-slate-800/90 border-red-500/50 shadow-sm'
                      : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected && isPlaying ? (
                        <Music className="w-3 h-3 animate-spin" />
                      ) : (
                        <Radio className="w-3 h-3" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{station.name}</span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          {station.frequency}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {station.city} • <span className="italic">{station.genre}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">
                      {isPlaying ? 'TOCANDO' : 'SELECIONADA'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Volume Slider */}
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white transition"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full accent-red-600 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          {hasError && (
            <div className="mt-2 text-[10px] text-red-300 bg-red-950/80 p-1.5 rounded border border-red-800">
              Falha ao conectar à transmissão desta rádio no momento. Tente outra estação da lista.
            </div>
          )}

          <div className="mt-2.5 flex justify-end">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
