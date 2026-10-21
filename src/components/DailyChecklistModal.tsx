/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaterialOperacional, FireStation } from '../types';
import { ClipboardCheck, Printer, X, Building, CheckSquare, Square, Flame } from 'lucide-react';

interface DailyChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: FireStation[];
  materials: MaterialOperacional[];
}

export const DailyChecklistModal: React.FC<DailyChecklistModalProps> = ({
  isOpen,
  onClose,
  stations,
  materials,
}) => {
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || 'eb-sao-vicente');
  const [prontidao, setProntidao] = useState<'Prontidão Amarela' | 'Prontidão Azul' | 'Prontidão Verde'>('Prontidão Amarela');
  const [encarregadoConferencia, setEncarregadoConferencia] = useState('1° Sgt PM Alves - RE 102.345-6');
  const [dataConferencia, setDataConferencia] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const currentStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const stationMaterials = materials.filter(
    (m) => m.estacaoId === currentStation.id || m.estacao === currentStation.nome
  );

  const handlePrint = () => {
    window.print();
  };

  const getProntidaoColorBadge = (p: string) => {
    if (p.includes('Amarela')) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (p.includes('Azul')) return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden in print) */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Termo de Conferência Diária de Carga Operacional
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form controls (Hidden in print) */}
        <div className="bg-slate-950/60 p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs print:hidden">
          <div>
            <label className="block text-slate-400 mb-1">Estação de Bombeiros:</label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.sgb})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Prontidão / Pelotão:</label>
            <select
              value={prontidao}
              onChange={(e) => setProntidao(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-semibold"
            >
              <option value="Prontidão Amarela">Prontidão Amarela</option>
              <option value="Prontidão Azul">Prontidão Azul</option>
              <option value="Prontidão Verde">Prontidão Verde</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Data da Conferência:</label>
            <input
              type="date"
              value={dataConferencia}
              onChange={(e) => setDataConferencia(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Encarregado da Conferência:</label>
            <input
              type="text"
              value={encarregadoConferencia}
              onChange={(e) => setEncarregadoConferencia(e.target.value)}
              placeholder="Ex: 1° Sgt PM Alves - RE 102.345-6"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-amber-300 font-medium"
            />
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 bg-white text-black overflow-y-auto flex-1 font-serif print:p-0 print:m-0 print:overflow-visible">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-700">
              POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
            </div>
            <div className="text-sm uppercase font-black text-slate-900">
              CORPO DE BOMBEIROS • 6° GRUPAMENTO DE BOMBEIROS • {currentStation.sgb.toUpperCase()}
            </div>
            <div className="text-base font-black mt-1 text-red-900 underline">
              TERMO DE CONFERÊNCIA DIÁRIA DE MATERIAL OPERACIONAL (M.O.)
            </div>
            <div className="text-xs mt-1 text-slate-700">
              Posto: <strong>{currentStation.nome}</strong> | Data: <strong>{dataConferencia}</strong> | Pelotão: <strong>{prontidao}</strong>
            </div>
          </div>

          {/* Details table */}
          <table className="w-full text-left text-xs border border-collapse border-black mb-6">
            <thead>
              <tr className="bg-slate-200 text-black border-b border-black text-[11px] uppercase">
                <th className="p-1.5 border-r border-black w-8 text-center">CONF.</th>
                <th className="p-1.5 border-r border-black">PATRIMÔNIO</th>
                <th className="p-1.5 border-r border-black">MATERIAL / EQUIPAMENTO</th>
                <th className="p-1.5 border-r border-black">LOCALIZAÇÃO</th>
                <th className="p-1.5 border-r border-black">STATUS</th>
                <th className="p-1.5 border-r border-black">ESTADO</th>
                <th className="p-1.5">OBSERVAÇÕES OPERACIONAIS</th>
              </tr>
            </thead>
            <tbody>
              {stationMaterials.map((m) => (
                <tr key={m.id} className="border-b border-slate-300">
                  <td className="p-1.5 border-r border-black text-center font-bold">
                    [ &nbsp; ]
                  </td>
                  <td className="p-1.5 border-r border-black font-mono font-bold">
                    {m.patrimonio}
                  </td>
                  <td className="p-1.5 border-r border-black font-sans">
                    <strong>{m.tipo}</strong> ({m.marca} {m.modelo})
                  </td>
                  <td className="p-1.5 border-r border-black font-sans">
                    {m.localizacaoInterna || 'Viatura'}
                  </td>
                  <td className="p-1.5 border-r border-black font-sans font-bold">
                    {m.status}
                  </td>
                  <td className="p-1.5 border-r border-black font-sans">
                    {m.estadoConservacao}
                  </td>
                  <td className="p-1.5 font-sans text-[11px]">
                    {m.observacao || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Observations */}
          <div className="border border-black p-3 text-xs mb-8">
            <strong>Alterações constatadas na conferência de carga:</strong>
            <div className="border-b border-dotted border-black mt-4 h-4"></div>
            <div className="border-b border-dotted border-black mt-4 h-4"></div>
          </div>

          {/* Single Encarregado da Conferência Signature */}
          <div className="max-w-md mx-auto text-center text-xs mt-12 pt-6">
            <div className="border-t border-black pt-1">
              <div className="font-bold uppercase">{encarregadoConferencia}</div>
              <div className="text-[11px] text-slate-700">Encarregado da Conferência de Material</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Posto de Bombeiros {currentStation.nome} • {prontidao}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
