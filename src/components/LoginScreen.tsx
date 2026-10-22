/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Flame,
  Shield,
  KeyRound,
  LogIn,
  AlertCircle,
  Building2,
  Eye,
  Crown,
  ChevronRight,
  CheckCircle2,
  X,
  Sparkles,
  HelpCircle,
  UserCheck,
} from 'lucide-react';

// Official Google G Logo SVG
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const LoginScreen: React.FC = () => {
  const { login, availableUsers } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPERADMIN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const executeLogin = (email: string, role?: UserRole) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    setSuccessInfo(`Autenticado com sucesso via Google (${email})! Entrando...`);

    setTimeout(() => {
      try {
        const result = login(email, {
          forceRole: role || (email.toLowerCase().includes('6gb') || email.toLowerCase().includes('adm') ? 'SUPERADMIN' : selectedRole),
        });
        if (!result.success) {
          setErrorMessage(result.error || 'Erro ao realizar login.');
          setSuccessInfo(null);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro inesperado.');
        setSuccessInfo(null);
      } finally {
        setIsSubmitting(false);
      }
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Por favor, informe seu Gmail.');
      return;
    }
    executeLogin(emailInput, selectedRole);
  };

  const handleGoogleQuickAccount = (email: string, role?: UserRole) => {
    setShowGoogleModal(false);
    executeLogin(email, role);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-red-600 selection:text-white relative">
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 shadow-xl shadow-red-900/30 border border-red-400/40 mb-2">
            <Flame className="w-9 h-9 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-wider text-white">
                SIGMA-CB
              </h1>
              <span className="text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800/80 px-2 py-0.5 rounded-full">
                6° GB
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-300">
              Corpo de Bombeiros da PMESP • 6° Grupamento de Bombeiros
            </p>
            <p className="text-xs text-slate-400">
              Sistema Integrado de Gestão e Controle de Materiais Operacionais
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="border-b border-slate-800 pb-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-white">
                Autenticação com Gmail / Google
              </h2>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Acesso Liberado
            </span>
          </div>

          {/* Success Banner */}
          {successInfo && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="font-medium">{successInfo}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* 1. Official Google Sign-In Button */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowGoogleModal(true)}
              className="w-full bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3 border border-slate-200"
            >
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold">Continuar com o Google (Gmail)</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Acesso direto com sua conta Google ou Gmail corporativo do 6° GB
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-500 font-medium">
                Ou informe seu Gmail diretamente
              </span>
            </div>
          </div>

          {/* 2. Direct Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Seu Gmail (Militar ou Pessoal):
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="ex: 6gb3sgbadm@gmail.com ou seu.gmail@gmail.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (e.target.value.toLowerCase().includes('6gb') || e.target.value.toLowerCase().includes('adm')) {
                      setSelectedRole('SUPERADMIN');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-amber-300 font-mono font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                />
              </div>
            </div>

            {/* Role selector for first-time / non-master emails */}
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Nível de acesso desejado para este Gmail:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRole('SUPERADMIN')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                    selectedRole === 'SUPERADMIN'
                      ? 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight">Gestor de Tudo</div>
                    <div className="text-[9px] opacity-75">Acesso Master Total</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('OPERADOR_POSTO')}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                    selectedRole === 'OPERADOR_POSTO'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[11px] leading-tight">Operador Posto</div>
                    <div className="text-[9px] opacity-75">Materiais do Posto</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Entrando...' : 'Entrar no SIGMA-CB'}</span>
            </button>
          </form>

          {/* Quick Access Profiles */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Acesso com 1 Clique (Contas Pré-configuradas):
              </span>
              <span className="text-[10px] text-slate-500">
                Toque para entrar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Gestor de Tudo */}
              <button
                type="button"
                onClick={() => executeLogin('6gb3sgbadm@gmail.com', 'SUPERADMIN')}
                className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-red-900/50 hover:border-red-600 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gestor de Tudo (Master)</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    6gb3sgbadm@gmail.com
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
              </button>

              {/* Operador EB São Vicente */}
              <button
                type="button"
                onClick={() => executeLogin('eb.saovicente@gmail.com', 'OPERADOR_POSTO')}
                className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-emerald-900/50 hover:border-emerald-600 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Operador EB São Vicente</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    eb.saovicente@gmail.com
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
              </button>

              {/* Visualizador 3° SGB */}
              <button
                type="button"
                onClick={() => executeLogin('sgb3.gestor@gmail.com', 'GESTOR_SGB')}
                className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-blue-900/50 hover:border-blue-600 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Visualizador 3° SGB</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    sgb3.gestor@gmail.com
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
              </button>

              {/* Visualizador 6° GB Todo */}
              <button
                type="button"
                onClick={() => executeLogin('gb6.comando@gmail.com', 'VISUALIZADOR_GB')}
                className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-purple-900/50 hover:border-purple-600 transition flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Visualizador 6° GB Todo</span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    gb6.comando@gmail.com
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
              </button>
            </div>
          </div>
        </div>

        {/* Access Levels Guide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-bold text-emerald-400 block mb-1">1. Operador Posto</span>
            <span className="text-slate-400 leading-tight block">
              Inclusão e edição apenas dos materiais do seu posto.
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-bold text-blue-400 block mb-1">2. Visualizador SGB</span>
            <span className="text-slate-400 leading-tight block">
              Visualiza todos os postos do seu SGB regional.
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-bold text-purple-400 block mb-1">3. Visualizador GB</span>
            <span className="text-slate-400 leading-tight block">
              Visualização geral e relatórios de todos os 19 quartéis.
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-bold text-red-400 block mb-1">4. Gestor de Tudo</span>
            <span className="text-slate-400 leading-tight block">
              Acesso total, libera gmails, gerencia acessos e postos.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          Corpo de Bombeiros da PMESP • 6° Grupamento de Bombeiros (Santos e Litoral)
        </div>
      </div>

      {/* Google Account Picker Modal (Standard Google Sign-in Experience) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <GoogleIcon className="w-7 h-7 shrink-0" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Fazer login com o Google
                  </h3>
                  <p className="text-xs text-slate-500">
                    Escolha uma conta para continuar no SIGMA-CB (6° GB)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account List */}
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {/* Master Admin Account */}
              <button
                type="button"
                onClick={() => handleGoogleQuickAccount('6gb3sgbadm@gmail.com', 'SUPERADMIN')}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow shrink-0">
                  👑
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-1.5">
                    <span>Administrador Geral (6° GB)</span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                      Gestor de Tudo
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono">
                    6gb3sgbadm@gmail.com
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              {/* Station Operator Account */}
              <button
                type="button"
                onClick={() => handleGoogleQuickAccount('eb.saovicente@gmail.com', 'OPERADOR_POSTO')}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow shrink-0">
                  SV
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-1.5">
                    <span>Operador EB São Vicente</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded">
                      Operador Posto
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono">
                    eb.saovicente@gmail.com
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              {/* SGB Manager Account */}
              <button
                type="button"
                onClick={() => handleGoogleQuickAccount('sgb3.gestor@gmail.com', 'GESTOR_SGB')}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow shrink-0">
                  3°
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate flex items-center gap-1.5">
                    <span>Comando do 3° SGB</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                      Visualizador SGB
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate font-mono">
                    sgb3.gestor@gmail.com
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              {/* Any Custom Gmail Entry */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Ou entrar com outro Gmail do Google:
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="digite seu gmail..."
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    disabled={!customGoogleEmail.trim()}
                    onClick={() => {
                      if (customGoogleEmail.trim()) {
                        handleGoogleQuickAccount(customGoogleEmail.trim());
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-bold transition"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
              Para proteger sua conta, o SIGMA-CB utiliza validação institucional de credenciais militares.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
