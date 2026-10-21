/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FireStation, MaterialOperacional, SgbId } from '../types';
import { OFFICIAL_SGBS } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Edit2,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';

interface StationsViewProps {
  stations: FireStation[];
  materials: MaterialOperacional[];
  onUpdateStation: (id: string, data: Partial<FireStation>) => Promise<void>;
  onAddStation: (data: Partial<FireStation>) => Promise<void>;
  onFilterStationMaterials: (stationId: string) => void;
}

export const StationsView: React.FC<StationsViewProps> = ({
  stations,
  materials,
  onUpdateStation,
  onAddStation,
  onFilterStationMaterials,
}) => {
  const { canEditStations, isRestrictedToSGB, isRestrictedToStation, currentUser } = useAuth();
  const [selectedSgbFilter, setSelectedSgbFilter] = useState<string>(
    isRestrictedToSGB ? currentUser.sgbAutorizado || '3° SGB' : 'ALL'
  );

  const [editingStation, setEditingStation] = useState<FireStation | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [sgb, setSgb] = useState<SgbId>('3° SGB');
  const [gb, setGb] = useState('6° GB');
  const [cidade, setCidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [emailPosto, setEmailPosto] = useState('');
  const [comandante, setComandante] = useState('');
  const [lat, setLat] = useState(-23.9634);
  const [lng, setLng] = useState(-46.3919);

  const startEdit = (st: FireStation) => {
    setEditingStation(st);
    setNome(st.nome);
    setSgb(st.sgb);
    setGb(st.gb);
    setCidade(st.cidade);
    setEndereco(st.endereco);
    setTelefone(st.telefone);
    setEmailPosto(st.emailPosto);
    setComandante(st.comandante || '');
    setLat(st.lat);
    setLng(st.lng);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    try {
      await onUpdateStation(editingStation.id, {
        nome,
        sgb,
        gb,
        cidade,
        endereco,
        telefone,
        emailPosto,
        comandante,
        lat: Number(lat),
        lng: Number(lng),
      });
      setEditingStation(null);
    } catch (err) {
      alert('Erro ao atualizar posto');
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddStation({
        nome: nome.toUpperCase().trim(),
        sgb,
        gb,
        cidade,
        endereco,
        telefone,
        emailPosto: emailPosto.toLowerCase().trim(),
        comandante,
        lat: Number(lat),
        lng: Number(lng),
        ativa: true,
      });
      setIsAdding(false);
      setNome('');
    } catch (err) {
      alert('Erro ao criar posto');
    }
  };

  const [onlyMyStation, setOnlyMyStation] = useState(false);

  const filteredStations = stations.filter((st) => {
    if (onlyMyStation && isRestrictedToStation) {
      return st.id === currentUser.estacaoAutorizadaId;
    }
    if (selectedSgbFilter !== 'ALL') {
      return st.sgb === selectedSgbFilter;
    }
    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <span>Postos de Bombeiros (6° GB)</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              {stations.length} Quartéis
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Total de {stations.length} quartéis distribuídos nos 4 Subgrupamentos de Bombeiros (1°, 2°, 3° e 4° SGB).
          </p>
        </div>

        {/* Filter Tabs by SGB */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex-wrap">
          <button
            onClick={() => {
              setOnlyMyStation(false);
              setSelectedSgbFilter('ALL');
            }}
            className={`px-2.5 py-1 rounded font-medium transition ${
              selectedSgbFilter === 'ALL' && !onlyMyStation
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({stations.length})
          </button>

          {OFFICIAL_SGBS.map((sgbOption) => {
            const count = stations.filter((s) => s.sgb === sgbOption).length;
            const isSelected = selectedSgbFilter === sgbOption && !onlyMyStation;
            const isUserSgb = isRestrictedToSGB && sgbOption === currentUser.sgbAutorizado;

            return (
              <button
                key={sgbOption}
                onClick={() => {
                  setOnlyMyStation(false);
                  setSelectedSgbFilter(sgbOption);
                }}
                className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isUserSgb ? 'Seu SGB Autorizado' : undefined}
              >
                <span>{sgbOption}</span>
                <span className="text-[10px] opacity-80">({count})</span>
                {isUserSgb && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}

          {isRestrictedToStation && currentUser.estacaoAutorizadaId && (
            <button
              onClick={() => setOnlyMyStation(!onlyMyStation)}
              className={`px-2 py-1 rounded font-medium transition text-[11px] border ${
                onlyMyStation
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50'
              }`}
            >
              {onlyMyStation ? '✓ Apenas Meu Posto' : 'Filtrar Meu Posto'}
            </button>
          )}
        </div>

        {canEditStations && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingStation(null);
              setNome('');
              setCidade('');
              setEndereco('');
              setTelefone('');
              setEmailPosto('');
              setComandante('');
            }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Posto</span>
          </button>
        )}
      </div>

      {/* Edit or Add Form */}
      {(editingStation || isAdding) && (
        <form
          onSubmit={editingStation ? handleSaveEdit : handleCreateStation}
          className="bg-slate-950 border border-red-900/60 rounded-xl p-4 space-y-3.5 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-white text-sm">
              {editingStation ? `Editar Posto: ${editingStation.nome}` : 'Cadastrar Novo Posto de Bombeiros'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingStation(null);
                setIsAdding(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nome do Posto: *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: SÃO VICENTE"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">SGB: *</label>
              <select
                value={sgb}
                onChange={(e) => setSgb(e.target.value as SgbId)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-bold"
              >
                {OFFICIAL_SGBS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Grupamento (GB): *</label>
              <input
                type="text"
                disabled
                value="6° GB"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-400 opacity-80"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cidade: *</label>
              <input
                type="text"
                required
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: São Vicente"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Endereço Completo:</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Ex: Av. Capitão-Mor Aguiar, 761 - Centro"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gmail Autorizado do Posto: *</label>
              <input
                type="email"
                required
                value={emailPosto}
                onChange={(e) => setEmailPosto(e.target.value)}
                placeholder="ex: eb.saovicente@gmail.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingStation(null);
                setIsAdding(false);
              }}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Posto</span>
            </button>
          </div>
        </form>
      )}

      {/* Grid of Stations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStations.map((st) => {
          const stMaterials = materials.filter(
            (m) => m.estacaoId === st.id || m.estacao === st.nome
          );
          const total = stMaterials.length;
          const operando = stMaterials.filter((m) => m.status === 'OPERANDO').length;
          const baixado = stMaterials.filter((m) => m.status === 'BAIXADO').length;
          const readiness = total > 0 ? Math.round((operando / total) * 100) : 100;

          const isMyStation = isRestrictedToStation && st.id === currentUser.estacaoAutorizadaId;
          const isMySgb = isRestrictedToSGB && st.sgb === currentUser.sgbAutorizado;

          return (
            <div
              key={st.id}
              className={`bg-slate-900 border rounded-xl p-3.5 flex flex-col justify-between transition ${
                isMyStation
                  ? 'border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : isMySgb
                  ? 'border-blue-600/70 hover:border-blue-500'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/40">
                      {st.sgb}
                    </span>
                    {isMyStation && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                        ★ Seu Posto
                      </span>
                    )}
                    {isMySgb && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-900/80 text-blue-200 border border-blue-700">
                        Seu SGB
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">
                    {readiness}% pronto
                  </span>
                </div>

                <h3 className="text-base font-bold text-white flex items-center justify-between">
                  <span>{st.nome}</span>
                  {canEditStations && (
                    <button
                      onClick={() => startEdit(st)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                      title="Editar Posto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </h3>

                <p className="text-xs text-slate-400 mt-0.5 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                  <span className="truncate">{st.endereco}</span>
                </p>

                <div className="mt-2.5 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-400">Cmt:</span>
                    <span>{st.comandante || 'A designar'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-400">Gmail:</span>
                    <span className="font-mono text-amber-300 text-[11px] truncate">{st.emailPosto}</span>
                  </div>
                </div>

                {/* Counter Badges */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 text-center text-xs bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  <div>
                    <div className="text-emerald-400 font-bold">{operando}</div>
                    <div className="text-[9px] text-slate-400">Operando</div>
                  </div>
                  <div>
                    <div className="text-red-400 font-bold">{baixado}</div>
                    <div className="text-[9px] text-slate-400">Baixados</div>
                  </div>
                  <div>
                    <div className="text-slate-200 font-bold">{total}</div>
                    <div className="text-[9px] text-slate-400">Total</div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onFilterStationMaterials(st.id)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-1.5 rounded-lg text-xs transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Materiais de {st.nome}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
