/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ListFilter,
  MapPin,
  Bell,
  Building2,
  Users,
  Download,
  Upload,
  ClipboardCheck,
  ChevronDown,
  RefreshCw,
  LogOut,
  MoreVertical,
} from 'lucide-react';
import { AlertaItem } from '../types';
import { OnlineRadioPlayer } from './OnlineRadioPlayer';

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
    userRoleDescription,
    logout,
  } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const urgentCount = alerts.filter((a) => a.severidade === 'URGENTE').length;

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-lg w-full max-w-full overflow-x-clip">
      {/* ================= LINHA 1: IDENTIFICAÇÃO, RÁDIO E SESSÃO MILITAR ================= */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 py-2 flex items-center justify-between gap-2">
        {/* Lado Esquerdo: Identificação em Texto Limpo (Sem Imagens/Sem Ícones Poluindo) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm sm:text-base font-black tracking-wider text-white">
              SIGMA-CB
            </span>
            <span className="text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800/80 px-1.5 py-0.2 rounded">
              6° GB
            </span>
          </div>
          <span className="hidden md:inline text-[11px] text-slate-400 font-medium">
            | PMESP
          </span>
        </div>

        {/* Lado Direito: Rádio Online, Ações Rápidas e Perfil Militar / Login */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Rádio Online Integrada */}
          <OnlineRadioPlayer />

          {/* Botão de Acessos (Apenas Gestor de Tudo / Administrador) */}
          {canManageUsers && (
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition shadow-sm bg-red-600 hover:bg-red-500 text-white shrink-0"
              title="Gerenciar militares e liberar acessos por Gmail"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:inline">Acessos</span>
            </button>
          )}

          {/* Desktop Direct Tool Buttons (Conferência / Exportar / Importar / Reset) */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={onOpenChecklistModal}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2 py-1 rounded-lg text-xs font-medium transition"
              title="Conferência de Carga (Passagem de Serviço)"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Conferência</span>
            </button>

            <button
              onClick={onExportCsv}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2 py-1 rounded-lg text-xs font-medium transition"
              title="Exportar dados para Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar</span>
            </button>

            {canImportData && (
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-2 py-1 rounded-lg text-xs font-medium transition"
                title="Importar CSV"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Importar</span>
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={onResetData}
                className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition"
                title="Restaurar dados padrão"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile / Tablet Compact Tools Dropdown Button */}
          <div className="relative lg:hidden">
            <button
              onClick={() => {
                setToolsDropdownOpen(!toolsDropdownOpen);
                setUserDropdownOpen(false);
              }}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs transition"
              title="Mais ferramentas (Conferência, Exportar)"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-fade-in">
                <button
                  onClick={() => {
                    setToolsDropdownOpen(false);
                    onOpenChecklistModal();
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition"
                >
                  <ClipboardCheck className="w-4 h-4 text-amber-400" />
                  <span>Conferência de Carga</span>
                </button>

                <button
                  onClick={() => {
                    setToolsDropdownOpen(false);
                    onExportCsv();
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Exportar CSV</span>
                </button>

                {canImportData && (
                  <button
                    onClick={() => {
                      setToolsDropdownOpen(false);
                      onOpenImportModal();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Importar CSV</span>
                  </button>
                )}

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setToolsDropdownOpen(false);
                      onResetData();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-red-300 flex items-center gap-2 transition border-t border-slate-800 mt-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Restaurar Padrão</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sessão Militar / Perfil e Logout */}
          {currentUser && (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setToolsDropdownOpen(false);
                }}
                className="flex items-center gap-1 sm:gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg text-xs transition"
                title="Sessão militar ativa (clique para ver detalhes ou sair)"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200 max-w-[85px] sm:max-w-[140px] truncate text-[11px]">
                  {currentUser.email.split('@')[0]}
                </span>
                <span className="text-[9px] bg-slate-800 text-amber-300 px-1 py-0.2 rounded font-mono font-bold hidden sm:inline">
                  {userRoleLabel.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                  {/* Informações da Conta */}
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span>{isSuperAdmin ? '👑' : '🚒'}</span>
                      <span className="truncate">{currentUser.nome}</span>
                    </div>
                    <div className="text-[11px] text-amber-300 font-mono mt-0.5 truncate">
                      {currentUser.email}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 bg-slate-950 p-1.5 rounded border border-slate-800 leading-tight">
                      {userRoleDescription}
                    </div>
                  </div>

                  {/* Simulador de Acesso para SuperAdmin */}
                  {isSuperAdmin && (
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60 border-b border-slate-800">
                      <div className="px-3 py-1 bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Testar Perfil de Outro Militar:
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
                            className={`w-full text-left px-3 py-1.5 text-xs flex flex-col hover:bg-slate-800 transition ${
                              isCurrent
                                ? 'bg-red-950/40 border-l-2 border-red-500 text-white'
                                : 'text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-100 text-[11px] truncate">
                                {u.email === '6gb3sgbadm@gmail.com' ? '👑 ' : ''}
                                {u.nome}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono shrink-0 ml-1">
                                {u.nivelAcesso}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono truncate">
                              {u.email}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Botão de Logout */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/70 hover:bg-red-900/90 text-red-200 border border-red-800/60 rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Desconectar / Sair do SIGMA-CB</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= LINHA 2: ABAS PRINCIPAIS DE NAVEGAÇÃO ================= */}
      <div className="border-t border-slate-800/80 bg-slate-950/95 px-2 sm:px-4 lg:px-8 py-1.5">
        <div className="max-w-7xl mx-auto">
          <nav className="grid grid-cols-4 gap-1 sm:gap-2 w-full text-center">
            {/* 1. Materiais */}
            <button
              onClick={() => setCurrentTab('materials')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'materials'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/60'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 shrink-0" />
              <span>Materiais</span>
            </button>

            {/* 2. Mapa do GB */}
            <button
              onClick={() => setCurrentTab('map')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'map'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mapa GB</span>
            </button>

            {/* 3. Vencimentos / Alertas */}
            <button
              onClick={() => setCurrentTab('alerts')}
              className={`relative flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'alerts'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/60'
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span>Vencimentos</span>
              {urgentCount > 0 && (
                <span className="ml-0.5 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {urgentCount}
                </span>
              )}
            </button>

            {/* 4. Postos */}
            <button
              onClick={() => setCurrentTab('stations')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                currentTab === 'stations'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Postos</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
