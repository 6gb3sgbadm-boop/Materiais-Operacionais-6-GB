/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaterialOperacional, FireStation, MaterialStatus, EstadoConservacao, SgbId } from '../types';
import { OFFICIAL_SGBS } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Wrench,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Calendar,
  Building,
  Eye,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';

interface MaterialListProps {
  materials: MaterialOperacional[];
  stations: FireStation[];
  selectedCategory: string;
  selectedStationFilter: string;
  onChangeStationFilter: (st: string) => void;
  selectedStatus: string;
  onChangeStatusFilter: (st: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (mat: MaterialOperacional) => void;
  onOpenMaintenanceModal: (mat: MaterialOperacional) => void;
  onDeleteMaterial: (mat: MaterialOperacional) => void;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  stations,
  selectedCategory,
  selectedStationFilter,
  onChangeStationFilter,
  selectedStatus,
  onChangeStatusFilter,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenMaintenanceModal,
  onDeleteMaterial,
}) => {
  const {
    currentUser,
    canCreateMaterial,
    canEditMaterial,
    canDeleteMaterial,
    canRegisterMaintenance,
    isRestrictedToStation,
    isRestrictedToSGB,
  } = useAuth();

  const [selectedSgb, setSelectedSgb] = useState<string>('ALL');
  const [selectedConservation, setSelectedConservation] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Synchronize active SGB with user permissions
  const activeSgb = isRestrictedToSGB
    ? currentUser.sgbAutorizado || '3° SGB'
    : selectedSgb;

  // Stations filtered by SGB
  const accessibleStations = stations.filter((st) => {
    if (isRestrictedToStation) return st.id === currentUser.estacaoAutorizadaId;
    if (isRestrictedToSGB) return st.sgb === currentUser.sgbAutorizado;
    if (activeSgb !== 'ALL') return st.sgb === activeSgb;
    return true;
  });

  // Filter materials
  const filtered = materials.filter((m) => {
    if (isRestrictedToStation) {
      if (m.estacaoId !== currentUser.estacaoAutorizadaId && m.estacao !== currentUser.estacaoAutorizadaId) {
        return false;
      }
    } else if (isRestrictedToSGB) {
      if (m.sgb !== currentUser.sgbAutorizado) {
        return false;
      }
    } else if (activeSgb !== 'ALL') {
      if (m.sgb !== activeSgb) {
        return false;
      }
    }

    if (selectedCategory !== 'ALL' && m.categoria !== selectedCategory) return false;
    if (selectedStationFilter !== 'ALL' && m.estacaoId !== selectedStationFilter && m.estacao !== selectedStationFilter) return false;
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false;
    if (selectedConservation !== 'ALL' && m.estadoConservacao !== selectedConservation) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        m.patrimonio.toLowerCase().includes(q) ||
        m.tipo.toLowerCase().includes(q) ||
        m.marca.toLowerCase().includes(q) ||
        m.modelo.toLowerCase().includes(q) ||
        m.estacao.toLowerCase().includes(q) ||
        m.observacao.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: MaterialStatus) => {
    switch (status) {
      case 'OPERANDO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            OPERANDO
          </span>
        );
      case 'BAIXADO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">
            <XCircle className="w-3 h-3 text-red-400" />
            BAIXADO
          </span>
        );
      case 'EM MANUTENÇÃO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
            <Wrench className="w-3 h-3 text-amber-400" />
            MANUTENÇÃO
          </span>
        );
      case 'RESERVA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
            RESERVA
          </span>
        );
    }
  };

  const getConservationColor = (estado: EstadoConservacao) => {
    switch (estado) {
      case 'EXCELENTE':
        return 'text-emerald-400';
      case 'BOM':
        return 'text-blue-400';
      case 'REGULAR':
        return 'text-amber-400';
      case 'DANIFICADO/INSERVÍVEL':
        return 'text-red-400 font-semibold';
      default:
        return 'text-slate-400';
    }
  };

  const isDateExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr + 'T00:00:00').getTime() < new Date().getTime();
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por patrimônio, equipamento, marca, posto ou observação..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Visualização em Tabela"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Visualização em Cards (Sem rolagem horizontal)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Material Button */}
            {canCreateMaterial && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Material</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* SGB Filter Dropdown (1°, 2°, 3°, 4°) */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider font-semibold">
              Subgrupamento (SGB):
            </label>
            <select
              value={activeSgb}
              disabled={isRestrictedToSGB || isRestrictedToStation}
              onChange={(e) => {
                setSelectedSgb(e.target.value);
                onChangeStationFilter('ALL');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-red-500"
            >
              {isRestrictedToSGB ? (
                <option value={currentUser.sgbAutorizado}>
                  {currentUser.sgbAutorizado} (SGB Vinculado)
                </option>
              ) : isRestrictedToStation ? (
                <option value={currentUser.sgbAutorizado}>
                  {currentUser.sgbAutorizado}
                </option>
              ) : (
                <>
                  <option value="ALL">Todos os SGBs (6° GB)</option>
                  {OFFICIAL_SGBS.map((sgb) => (
                    <option key={sgb} value={sgb}>
                      {sgb}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Station Filter Dropdown */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider font-semibold">
              Posto de Bombeiro:
            </label>
            <select
              value={isRestrictedToStation ? currentUser.estacaoAutorizadaId : selectedStationFilter}
              disabled={isRestrictedToStation}
              onChange={(e) => onChangeStationFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-red-500"
            >
              {!isRestrictedToStation && (
                <option value="ALL">Todos os Postos ({accessibleStations.length})</option>
              )}
              {accessibleStations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider font-semibold">
              Status Operacional:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => onChangeStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="OPERANDO">OPERANDO</option>
              <option value="BAIXADO">BAIXADO</option>
              <option value="EM MANUTENÇÃO">EM MANUTENÇÃO</option>
              <option value="RESERVA">RESERVA</option>
            </select>
          </div>

          {/* Estado de Conservação */}
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5 uppercase tracking-wider font-semibold">
              Conservação:
            </label>
            <select
              value={selectedConservation}
              onChange={(e) => setSelectedConservation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">Todos os Estados</option>
              <option value="EXCELENTE">Excelente</option>
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="DANIFICADO/INSERVÍVEL">Danificado / Inservível</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Mode: Cards View (Zero horizontal scroll!) */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const canEdit = canEditMaterial(item);
              const canDelete = canDeleteMaterial(item);
              const canMaintain = canRegisterMaintenance(item);
              const expired = isDateExpired(item.dataValidade);

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-xl p-3.5 space-y-2.5 transition flex flex-col justify-between ${
                    item.status === 'BAIXADO' ? 'border-red-900/60 bg-red-950/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {item.patrimonio}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">{item.tipo}</h4>
                    <p className="text-xs text-slate-400">
                      {item.marca} {item.modelo}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                      <span className="bg-slate-800 text-red-300 px-1.5 py-0.5 rounded font-medium">
                        {item.categoria}
                      </span>
                      <span className="text-slate-400">
                        Posto: <strong className="text-slate-200">{item.estacao}</strong> ({item.sgb})
                      </span>
                      <span className={getConservationColor(item.estadoConservacao)}>
                        • {item.estadoConservacao}
                      </span>
                    </div>

                    {item.observacao && (
                      <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/70 p-2 rounded border border-slate-800/80 line-clamp-2">
                        {item.observacao}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      {item.proximaManutencao ? `Prev: ${item.proximaManutencao}` : 'Rotina OK'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {canMaintain && (
                        <button
                          onClick={() => onOpenMaintenanceModal(item)}
                          className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-300 rounded border border-slate-700"
                          title="Manutenção / Inspeção"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => onOpenEditModal(item)}
                          className="p-1.5 bg-slate-800 hover:bg-blue-600/30 text-blue-300 rounded border border-slate-700"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDeleteMaterial(item)}
                          className="p-1.5 bg-slate-800 hover:bg-red-600/30 text-red-400 rounded border border-slate-700"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!canEdit && !canDelete && (
                        <button
                          onClick={() => onOpenMaintenanceModal(item)}
                          className="p-1.5 bg-slate-800 text-slate-400 rounded border border-slate-700"
                          title="Ver detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              Nenhum material encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      ) : (
        /* View Mode: Compact Table (Reduced horizontal overflow, NO QUANTITY COLUMN) */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  <th className="py-2.5 px-3">PATRIMÔNIO</th>
                  <th className="py-2.5 px-3">MATERIAL / TIPO</th>
                  <th className="py-2.5 px-3">MARCA & MODELO</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">ESTADO</th>
                  <th className="py-2.5 px-3">POSTO (SGB)</th>
                  <th className="py-2.5 px-3">VALIDADE / PREV.</th>
                  <th className="py-2.5 px-3 max-w-[200px]">OBSERVAÇÃO</th>
                  <th className="py-2.5 px-3 text-right">AÇÕES</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const canEdit = canEditMaterial(item);
                    const canDelete = canDeleteMaterial(item);
                    const canMaintain = canRegisterMaintenance(item);
                    const expired = isDateExpired(item.dataValidade);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-800/50 transition ${
                          item.status === 'BAIXADO' ? 'bg-red-950/10' : ''
                        }`}
                      >
                        {/* PATRIMÔNIO */}
                        <td className="py-2 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                          {item.patrimonio}
                        </td>

                        {/* TIPO */}
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-100">{item.tipo}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.categoria} {item.localizacaoInterna ? `• ${item.localizacaoInterna}` : ''}
                          </div>
                        </td>

                        {/* MARCA & MODELO */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="text-slate-200">{item.marca}</span>{' '}
                          <span className="text-slate-400 text-[11px]">{item.modelo}</span>
                        </td>

                        {/* STATUS */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* ESTADO */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={getConservationColor(item.estadoConservacao)}>
                            {item.estadoConservacao}
                          </span>
                        </td>

                        {/* POSTO / SGB */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <Building className="w-3 h-3 text-red-400" />
                            <span>{item.estacao}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{item.sgb}</div>
                        </td>

                        {/* VALIDADE / PREVENTIVA */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          {item.dataValidade ? (
                            <div className={`text-[11px] flex items-center gap-1 ${expired ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                              <Calendar className="w-3 h-3" />
                              <span>{item.dataValidade}</span>
                            </div>
                          ) : item.proximaManutencao ? (
                            <div className="text-[11px] text-slate-400">
                              Prev: {item.proximaManutencao}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>

                        {/* OBSERVAÇÃO */}
                        <td className="py-2 px-3 max-w-[200px]">
                          <p className="text-slate-300 text-[11px] truncate" title={item.observacao}>
                            {item.observacao || '-'}
                          </p>
                        </td>

                        {/* AÇÕES */}
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {canMaintain ? (
                              <button
                                onClick={() => onOpenMaintenanceModal(item)}
                                className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-amber-300 rounded border border-slate-700"
                                title="Manutenção / Inspeção"
                              >
                                <Wrench className="w-3.5 h-3.5" />
                              </button>
                            ) : null}

                            {canEdit ? (
                              <button
                                onClick={() => onOpenEditModal(item)}
                                className="p-1.5 bg-slate-800 hover:bg-blue-600/30 text-blue-300 rounded border border-slate-700"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}

                            {canDelete ? (
                              <button
                                onClick={() => onDeleteMaterial(item)}
                                className="p-1.5 bg-slate-800 hover:bg-red-600/30 text-red-400 rounded border border-slate-700"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}

                            {!canEdit && !canDelete && !canMaintain && (
                              <button
                                onClick={() => onOpenMaintenanceModal(item)}
                                className="p-1.5 bg-slate-800 text-slate-400 rounded border border-slate-700"
                                title="Ver Histórico"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-500">
                      Nenhum material cadastrado para este posto e categoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
