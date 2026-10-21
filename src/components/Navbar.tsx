/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  MapPin,
  ListFilter,
  Bell,
  Users,
  Download,
  Upload,
  ClipboardCheck,
  Building2,
  ChevronDown,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { AlertaItem } from '../types';

interface NavbarProps {
  currentTab: 'materials' | 'map' | 'alerts' | 'stations';
  setCurrentTab: (tab: 'materials' | 'map' | 'alerts' | 'stations') => void;
  alerts: AlertaItem[];
  onOpenUserModal: () => void;
  onOpenImportModal: () => void;
  onOpenChecklistModal: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  alerts,
  onOpenUserModal,
  onOpenImportModal,
  onOpenChecklistModal,
  onExportCsv,
  onResetData,
}) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    canManageUsers,
    canImportData,
    isSuperAdmin,
    userRoleLabel,
  } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const urgentCount = alerts.filter((a) => a.severidade === 'URGENTE').length;

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-md shadow-red-900/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-wide">
                SIGMA-CB
              </span>
              <span className="text-[10px] bg-red-950/80 text-red-300 font-semibold px-1.5 py-0.2 rounded border border-red-800/60 uppercase">
                6° GB
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Corpo de Bombeiros • Gestão de Materiais
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setCurrentTab('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              currentTab === 'materials'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Materiais</span>
          </button>

          <button
            onClick={() => setCurrentTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              currentTab === 'map'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Mapa do GB</span>
          </button>

          <button
            onClick={() => setCurrentTab('alerts')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              currentTab === 'alerts'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Vencimentos</span>
            {urgentCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('stations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              currentTab === 'stations'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Postos</span>
          </button>
        </nav>

        {/* Action Tools & Clean User Selector */}
        <div className="flex items-center gap-2">
          {/* Daily Shift Checklist */}
          <button
            onClick={onOpenChecklistModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
            title="Conferência de Carga (Passagem de Serviço)"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Conferência</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
            title="Exportar dados da planilha"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Exportar</span>
          </button>

          {/* Import CSV (SuperAdmin only) */}
          {canImportData && (
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
              title="Importar CSV"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">Importar</span>
            </button>
          )}

          {/* Control Access (Gestão de Militares e Gmails) */}
          <button
            onClick={onOpenUserModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              isSuperAdmin
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40'
            }`}
            title="Gerenciar, editar e autorizar acessos dos militares por Gmail"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Acessos</span>
          </button>

          {/* Reset Demo Data Button (SuperAdmin only) */}
          {isSuperAdmin && (
            <button
              onClick={onResetData}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition"
              title="Restaurar dados padrão"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* User Profile Pill / Dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs transition"
              title="Alternar login para testar níveis de permissão"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-slate-200 hidden sm:inline max-w-[130px] truncate">
                {currentUser.email}
              </span>
              <span className="text-[10px] bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                {userRoleLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-semibold flex justify-between">
                  <span>Alternar Usuário:</span>
                  <span className="text-amber-400">4 Níveis</span>
                </div>
                {availableUsers.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-800 transition ${
                        isCurrent ? 'bg-red-950/40 border-l-2 border-red-500 text-white' : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">
                          {u.email === '6gb3sgbadm@gmail.com' ? '👑 ' : ''}
                          {u.nome}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono">
                          {u.nivelAcesso}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5">{u.email}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
