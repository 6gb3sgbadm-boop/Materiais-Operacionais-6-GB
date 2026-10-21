/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DashboardStats, CategoriaMaterial } from '../types';
import { OFFICIAL_CATEGORIES } from '../data/initialData';
import {
  CheckCircle2,
  XCircle,
  Wrench,
  AlertTriangle,
  Activity,
  Layers,
} from 'lucide-react';

interface DashboardOverviewProps {
  stats: DashboardStats;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  onGoToAlerts: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  onGoToAlerts,
}) => {
  return (
    <div className="space-y-3">
      {/* Primary KPI Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total */}
        <div
          onClick={() => onSelectStatus('ALL')}
          className={`cursor-pointer bg-slate-900 border rounded-xl p-3 transition hover:border-slate-600 ${
            selectedStatus === 'ALL' ? 'border-slate-400 ring-1 ring-slate-400' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Total Carga</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.totalEquipamentos}</div>
          <span className="text-[10px] text-slate-500">Equipamentos</span>
        </div>

        {/* Operando (Spreadsheet: EQUIPAMENTOS OPERANDO) */}
        <div
          onClick={() => onSelectStatus(selectedStatus === 'OPERANDO' ? 'ALL' : 'OPERANDO')}
          className={`cursor-pointer bg-slate-900 border rounded-xl p-3 transition hover:border-emerald-500/60 ${
            selectedStatus === 'OPERANDO'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/20'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span className="font-bold">OPERANDO</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300">{stats.operando}</div>
          <span className="text-[10px] text-emerald-500">Prontos p/ uso</span>
        </div>

        {/* Baixados (Spreadsheet: EQUIPAMENTOS BAIXADO) */}
        <div
          onClick={() => onSelectStatus(selectedStatus === 'BAIXADO' ? 'ALL' : 'BAIXADO')}
          className={`cursor-pointer bg-slate-900 border rounded-xl p-3 transition hover:border-red-500/60 ${
            selectedStatus === 'BAIXADO'
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-950/20'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-red-400 text-xs mb-1">
            <span className="font-bold">BAIXADOS</span>
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400">{stats.baixado}</div>
          <span className="text-[10px] text-red-500">Inservíveis / DMM</span>
        </div>

        {/* Em Manutenção */}
        <div
          onClick={() => onSelectStatus(selectedStatus === 'EM MANUTENÇÃO' ? 'ALL' : 'EM MANUTENÇÃO')}
          className={`cursor-pointer bg-slate-900 border rounded-xl p-3 transition hover:border-amber-500/60 ${
            selectedStatus === 'EM MANUTENÇÃO'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-950/20'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
            <span className="font-bold">MANUTENÇÃO</span>
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">{stats.emManutencao}</div>
          <span className="text-[10px] text-amber-500">Em oficina</span>
        </div>

        {/* Prontidão */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-blue-400 text-xs mb-1">
            <span className="font-medium">Prontidão</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.indiceProntidao}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                stats.indiceProntidao >= 85
                  ? 'bg-emerald-500'
                  : stats.indiceProntidao >= 70
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${stats.indiceProntidao}%` }}
            />
          </div>
        </div>

        {/* Vencimentos / Alertas */}
        <div
          onClick={onGoToAlerts}
          className={`cursor-pointer bg-slate-900 border rounded-xl p-3 transition hover:border-red-400 ${
            stats.vencidos + stats.manutencaoPendente > 0
              ? 'border-red-800/80 bg-red-950/20'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-red-400 text-xs mb-1">
            <span className="font-medium">Vencidos / Atrasados</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-300">
            {stats.vencidos + stats.manutencaoPendente}
          </div>
          <span className="text-[10px] text-red-400">
            {stats.vencendo30Dias > 0 ? `+${stats.vencendo30Dias} a vencer (30d)` : 'Ver pendências'}
          </span>
        </div>
      </div>

      {/* Official Spreadsheet Category Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-red-400" />
            Abas de Materiais da Planilha
          </span>
          <span className="text-[10px] text-slate-500">
            Clique na aba para filtrar
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              selectedCategory === 'ALL'
                ? 'bg-red-600 text-white shadow'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            Todas ({stats.totalEquipamentos})
          </button>

          {OFFICIAL_CATEGORIES.map((cat) => {
            const count = stats.porCategoria[cat];
            const isSelected = selectedCategory === cat;
            const total = count?.total || 0;
            const operando = count?.operando || 0;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(isSelected ? 'ALL' : cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1 rounded font-mono ${
                    isSelected ? 'bg-red-800 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {operando}/{total}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
