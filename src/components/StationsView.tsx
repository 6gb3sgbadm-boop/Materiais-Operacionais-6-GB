/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FireStation, MaterialOperacional, SgbId, Usuario } from '../types';
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
  Shield,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Map,
} from 'lucide-react';

interface StationsViewProps {
  stations: FireStation[];
  materials: MaterialOperacional[];
  onUpdateStation: (id: string, data: Partial<FireStation>) => Promise<void>;
  onAddStation: (data: Partial<FireStation>) => Promise<void>;
  onFilterStationMaterials: (stationId: string) => void;
  onViewStationOnMap?: (stationId: string) => void;
}

export const StationsView: React.FC<StationsViewProps> = ({
  stations,
  materials,
  onUpdateStation,
  onAddStation,
  onFilterStationMaterials,
  onViewStationOnMap,
}) => {
  const { canEditStations, isRestrictedToSGB, isRestrictedToStation, currentUser, availableUsers } = useAuth();
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

  // Helper to automatically derive the Comandante do SGB from authorized users
  const getSgbCommander = (sgbId: SgbId): { name: string; email: string; isAutoLinked: boolean; rank: string } => {
    const sgbUser = availableUsers.find(
      (u) => u.nivelAcesso === 'GESTOR_SGB' && u.sgbAutorizado === sgbId && u.ativo
    );
    if (sgbUser) {
      return {
        name: `${sgbUser.postoGraduacao} ${sgbUser.nome}`,
        email: sgbUser.email,
        isAutoLinked: true,
        rank: sgbUser.postoGraduacao,
      };
    }
    return {
      name: `Comando do ${sgbId}`,
      email: '',
      isAutoLinked: false,
      rank: 'Capitão PM',
    };
  };

  // Helper to automatically derive the Comandante / Encarregado do Posto from authorized users
  const getStationCommander = (
    station: FireStation
  ): { name: string; email: string; isAutoLinked: boolean; rank: string } => {
    const postUser = availableUsers.find(
      (u) =>
        u.nivelAcesso === 'OPERADOR_POSTO' &&
        (u.estacaoAutorizadaId === station.id ||
          u.email.toLowerCase() === station.emailPosto.toLowerCase()) &&
        u.ativo
    );
    if (postUser) {
      return {
        name: `${postUser.postoGraduacao} ${postUser.nome}`,
        email: postUser.email,
        isAutoLinked: true,
        rank: postUser.postoGraduacao,
      };
    }
    // Fallback to manual field
    return {
      name: station.comandante || 'A designar',
      email: station.emailPosto,
      isAutoLinked: false,
      rank: 'Bombeiro PM',
    };
  };

  const startEdit = (st: FireStation) => {
    setEditingStation(st);
    setNome(st.nome);
    setSgb(st.sgb);
    setGb(st.gb);
    setCidade(st.cidade);
    setEndereco(st.endereco);
    setTelefone(st.telefone);
    setEmailPosto(st.emailPosto);
    // Use manual or auto-linked commander
    const autoPostCmd = getStationCommander(st);
    setComandante(st.comandante || autoPostCmd.name);
    setLat(st.lat);
    setLng(st.lng);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    try {
      await onUpdateStation(editingStation.id, {
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
      setCidade('');
      setEndereco('');
      setTelefone('');
      setEmailPosto('');
      setComandante('');
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
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-500" />
            <span>Postos de Bombeiros (6° GB)</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              {stations.length} Quartéis
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Comandantes de SGB e de Postos vinculados automaticamente às liberações de acessos por Gmail.
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
                ? 'bg-red-600 text-white shadow'
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
                    ? 'bg-red-600 text-white shadow'
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
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
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
          className="bg-slate-950 border border-red-900/60 rounded-xl p-4 space-y-3.5 text-xs shadow-xl animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-white text-sm">
                {editingStation ? `Editar Configurações do Posto: ${editingStation.nome}` : 'Cadastrar Novo Posto de Bombeiros'}
              </h3>
            </div>
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 uppercase font-bold"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold"
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
                placeholder="Ex: Av. Capitão-Mor Aguiar, 761 - Centro, São Vicente - SP"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Commander fields (with auto-sync indicator) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {/* SGB Commander (Automatic from access) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-blue-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Comandante do {sgb}:</span>
                </span>
                <span className="text-[10px] text-blue-300 bg-blue-950 px-1.5 py-0.2 rounded font-mono">
                  Puxado do Acesso do SGB
                </span>
              </label>
              <input
                type="text"
                disabled
                value={getSgbCommander(sgb).name}
                className="w-full bg-slate-950 border border-blue-900/60 rounded-lg px-2.5 py-1.5 text-blue-200 font-semibold opacity-90 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ao alterar o militar no menu <strong>Acessos</strong> (cargo <em>Visualizador de SGB</em>), atualiza automaticamente todos os postos deste SGB.
              </p>
            </div>

            {/* Station Commander (Automatic or editable) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-emerald-400">
                  <User className="w-3.5 h-3.5" />
                  <span>Comandante / Encarregado do Posto:</span>
                </span>
                {editingStation && (
                  <button
                    type="button"
                    onClick={() => {
                      const auto = getStationCommander(editingStation);
                      setComandante(auto.name);
                    }}
                    className="text-[10px] text-emerald-300 hover:text-white flex items-center gap-1 bg-emerald-950 px-1.5 py-0.2 rounded font-mono"
                    title="Puxar o militar vinculado a este posto em Acessos"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Sincronizar Acesso</span>
                  </button>
                )}
              </label>
              <input
                type="text"
                value={comandante}
                onChange={(e) => setComandante(e.target.value)}
                placeholder="Ex: 1° Ten PM Rocha"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold focus:border-red-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Puxado do operador atribuído a este posto em <strong>Acessos</strong>, ou preenchido manualmente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Telefone do Posto:</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(13) 3569-1930"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Latitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Longitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setEditingStation(null);
                setIsAdding(false);
              }}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs transition hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs shadow transition"
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

          // Automatically derive SGB commander & Station commander from authorized users
          const sgbCmd = getSgbCommander(st.sgb);
          const postCmd = getStationCommander(st);

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
                  <span>POSTO {st.nome}</span>
                  {canEditStations && (
                    <button
                      onClick={() => startEdit(st)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                      title="Editar Posto e Comandante"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </h3>

                <p className="text-xs text-slate-400 mt-0.5 flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                  <span className="truncate">{st.endereco}</span>
                </p>

                {/* Command & Officers Block (Linked with permissions) */}
                <div className="mt-3 space-y-1.5 text-xs">
                  {/* Comandante do SGB */}
                  <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-2 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Cmt {st.sgb}:</span>
                      <span className="font-semibold text-slate-200 truncate text-[11px]">
                        {sgbCmd.name}
                      </span>
                    </div>
                    {sgbCmd.isAutoLinked && (
                      <span
                        className="text-[9px] bg-blue-950 text-blue-300 border border-blue-800/80 px-1.5 py-0.2 rounded font-mono shrink-0"
                        title="Puxado automaticamente do militar autorizado no SGB"
                      >
                        ✓ Acesso SGB
                      </span>
                    )}
                  </div>

                  {/* Comandante / Encarregado do Posto */}
                  <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-2 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-400 text-[11px]">Cmt Posto:</span>
                      <span className="font-semibold text-slate-200 truncate text-[11px]">
                        {postCmd.name}
                      </span>
                    </div>
                    {postCmd.isAutoLinked ? (
                      <span
                        className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded font-mono shrink-0"
                        title="Puxado automaticamente do militar operador deste posto"
                      >
                        ✓ Acesso Posto
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono shrink-0">
                        Manual
                      </span>
                    )}
                  </div>

                  {/* Gmail do Posto */}
                  <div className="flex items-center gap-1.5 text-slate-300 px-1 pt-0.5">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-slate-400 text-[11px]">Gmail:</span>
                    <span className="font-mono text-amber-300 text-[11px] truncate">
                      {st.emailPosto}
                    </span>
                  </div>
                </div>

                {/* Readiness summary counters */}
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

              {/* Action Buttons: Ver no Mapa Tático & Ver Materiais */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {onViewStationOnMap && (
                  <button
                    onClick={() => onViewStationOnMap(st.id)}
                    className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-1.5 rounded-lg text-[11px] transition border border-slate-700"
                    title="Visualizar este quartel no Mapa Tático com caminhão de bombeiro"
                  >
                    <Map className="w-3 h-3 text-red-400" />
                    <span>Ver no Mapa</span>
                  </button>
                )}

                <button
                  onClick={() => onFilterStationMaterials(st.id)}
                  className={`flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white font-medium py-1.5 rounded-lg text-[11px] transition shadow ${
                    !onViewStationOnMap ? 'col-span-2' : ''
                  }`}
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ver Materiais</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
