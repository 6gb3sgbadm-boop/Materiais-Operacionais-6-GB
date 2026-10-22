/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Shield,
  KeyRound,
  LogIn,
  AlertCircle,
  Building2,
  Lock,
  Eye,
  Crown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, availableUsers } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = login(emailInput);
      if (!result.success) {
        setErrorMessage(result.error || 'Acesso não autorizado.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setEmailInput(email);
    setErrorMessage(null);
    const result = login(email);
    if (!result.success) {
      setErrorMessage(result.error || 'Acesso não autorizado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-red-600 selection:text-white">
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
                Autenticação de Acesso Militar
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Acesso Restrito
            </span>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gmail Militar Cadastrado do Quartel / Encarregado: *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="ex: eb.saovicente@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-amber-300 font-mono font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Digite o Gmail cadastrado pelo Gestor de Tudo para o seu posto ou SGB.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar no SIGMA-CB</span>
            </button>
          </form>

          {/* Quick Login Test Options */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Acessos Rápidos Homologados:
              </span>
              <span className="text-[10px] text-slate-500">
                Clique para testar cada nível
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Gestor de Tudo */}
              <button
                type="button"
                onClick={() => handleQuickLogin('6gb3sgbadm@gmail.com')}
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
                onClick={() => handleQuickLogin('eb.saovicente@gmail.com')}
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
                onClick={() => handleQuickLogin('sgb3.gestor@gmail.com')}
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
                onClick={() => handleQuickLogin('gb6.comando@gmail.com')}
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
    </div>
  );
};
