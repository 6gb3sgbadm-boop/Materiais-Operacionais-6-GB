/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertaItem, MaterialOperacional } from '../types';
import {
  Bell,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  Calendar,
  Building,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface AlertsPanelProps {
  alerts: AlertaItem[];
  materials: MaterialOperacional[];
  onOpenMaintenanceModal: (mat: MaterialOperacional) => void;
  onFilterByMaterial: (patrimonio: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  materials,
  onOpenMaintenanceModal,
  onFilterByMaterial,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'URGENTE' | 'ALERTA' | 'INFO'>('ALL');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'ALL' && a.severidade !== filterSeverity) return false;
    return true;
  });

  const urgentCount = alerts.filter((a) => a.severidade === 'URGENTE').length;
  const warningCount = alerts.filter((a) => a.severidade === 'ALERTA').length;
  const infoCount = alerts.filter((a) => a.severidade === 'INFO').length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Central de Notificações Automáticas e Vencimentos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento preditivo de validade operacional, testes hidrostáticos e manutenção preventiva periódica.
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterSeverity('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              filterSeverity === 'ALL'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({alerts.length})
          </button>
          <button
            onClick={() => setFilterSeverity('URGENTE')}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 ${
              filterSeverity === 'URGENTE'
                ? 'bg-red-600 text-white'
                : 'text-red-400 hover:text-red-300'
            }`}
          >
            <span>Urgentes</span>
            <span className="bg-red-950 px-1.5 py-0.2 rounded font-mono text-[10px]">
              {urgentCount}
            </span>
          </button>
          <button
            onClick={() => setFilterSeverity('ALERTA')}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 ${
              filterSeverity === 'ALERTA'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>A Vencer (30d)</span>
            <span className="bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px]">
              {warningCount}
            </span>
          </button>
          <button
            onClick={() => setFilterSeverity('INFO')}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 ${
              filterSeverity === 'INFO'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>Baixados</span>
            <span className="bg-slate-800 px-1.5 py-0.2 rounded font-mono text-[10px]">
              {infoCount}
            </span>
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const correspondingMaterial = materials.find((m) => m.id === alert.materialId);

            const isUrgent = alert.severidade === 'URGENTE';
            const isWarning = alert.severidade === 'ALERTA';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isUrgent
                    ? 'bg-red-950/30 border-red-800/80'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-800/70'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 ${
                      isUrgent
                        ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                        : isWarning
                        ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    ) : isWarning ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-amber-300 text-xs">
                        {alert.patrimonio}
                      </span>
                      <span className="text-xs font-semibold text-slate-100">
                        {alert.tipoMaterial}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <Building className="w-3 h-3 text-red-400" />
                        <span>{alert.estacao}</span>
                      </span>
                    </div>

                    <p
                      className={`text-xs mt-1 font-medium ${
                        isUrgent ? 'text-red-200' : isWarning ? 'text-amber-200' : 'text-slate-300'
                      }`}
                    >
                      {alert.mensagem}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                      <span>Data de Referência: {alert.dataReferencia}</span>
                      {alert.diasRestantes !== undefined && (
                        <span>
                          {alert.diasRestantes < 0
                            ? `Expirou há ${Math.abs(alert.diasRestantes)} dias`
                            : `Vence em ${alert.diasRestantes} dias`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {correspondingMaterial && (
                    <button
                      onClick={() => onOpenMaintenanceModal(correspondingMaterial)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow ${
                        isUrgent
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Registrar Manutenção</span>
                    </button>
                  )}

                  <button
                    onClick={() => onFilterByMaterial(alert.patrimonio)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver na Carga</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">Nenhum Alerta Pendente</h4>
            <p className="text-xs mt-1 text-slate-400">
              Todos os materiais operacionais estão com validades e manutenções preventivas em dia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
