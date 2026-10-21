/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Usuario, FireStation, UserRole, SgbId } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Building2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Shield,
  AlertCircle,
  Lock,
  Eye,
  LogIn,
  KeyRound,
  Edit3,
  Search,
  RotateCcw,
  Save,
  Crown,
  UserCheck,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: FireStation[];
  onAddUser: (user: Partial<Usuario>) => Promise<void>;
  onUpdateUser: (id: string, user: Partial<Usuario>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

const POSTOS_GRADUACOES = [
  'Coronel PM',
  'Tenente-Coronel PM',
  'Major PM',
  'Capitão PM',
  '1° Tenente PM',
  '2° Tenente PM',
  'Subtenente PM',
  '1° Sargento PM',
  '2° Sargento PM',
  '3° Sargento PM',
  'Cabo PM',
  'Soldado PM',
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  stations,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const { availableUsers, currentUser, setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | UserRole>('ALL');

  // New user form state
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [postoGraduacao, setPostoGraduacao] = useState('1° Sargento PM');
  const [nivelAcesso, setNivelAcesso] = useState<UserRole>('OPERADOR_POSTO');
  const [estacaoAutorizadaId, setEstacaoAutorizadaId] = useState(stations[0]?.id || 'eb-sao-vicente');
  const [sgbAutorizado, setSgbAutorizado] = useState<SgbId>('3° SGB');

  // Edit user state
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editNome, setEditNome] = useState('');
  const [editPostoGraduacao, setEditPostoGraduacao] = useState('');
  const [editNivelAcesso, setEditNivelAcesso] = useState<UserRole>('OPERADOR_POSTO');
  const [editEstacaoId, setEditEstacaoId] = useState('');
  const [editSgb, setEditSgb] = useState<SgbId>('3° SGB');
  const [editAtivo, setEditAtivo] = useState(true);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const startEditing = (user: Usuario) => {
    setIsAdding(false);
    setError(null);
    setEditingUser(user);
    setEditEmail(user.email);
    setEditNome(user.nome);
    setEditPostoGraduacao(user.postoGraduacao || '1° Sargento PM');
    setEditNivelAcesso(user.nivelAcesso);
    setEditEstacaoId(user.estacaoAutorizadaId || stations[0]?.id || 'eb-sao-vicente');
    setEditSgb(user.sgbAutorizado || '3° SGB');
    setEditAtivo(user.ativo);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editEmail.trim() || !editNome.trim()) {
      setError('E-mail e Nome do militar são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isMaster = editingUser.email === '6gb3sgbadm@gmail.com';
      const updatedPayload: Partial<Usuario> = {
        email: isMaster ? '6gb3sgbadm@gmail.com' : editEmail.trim().toLowerCase(),
        nome: editNome.trim(),
        postoGraduacao: editPostoGraduacao,
        nivelAcesso: isMaster ? 'SUPERADMIN' : editNivelAcesso,
        estacaoAutorizadaId: editNivelAcesso === 'OPERADOR_POSTO' ? editEstacaoId : undefined,
        sgbAutorizado: editNivelAcesso === 'GESTOR_SGB' || editNivelAcesso === 'OPERADOR_POSTO' ? editSgb : undefined,
        ativo: isMaster ? true : editAtivo,
      };

      await onUpdateUser(editingUser.id, updatedPayload);

      // If user is editing their current active profile, sync local state
      if (currentUser.id === editingUser.id) {
        setCurrentUser({ ...currentUser, ...updatedPayload } as Usuario);
      }

      setEditingUser(null);
      showNotification(`Militar ${editNome} atualizado com sucesso!`);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados do militar');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !nome.trim()) {
      setError('E-mail e Nome do responsável são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onAddUser({
        email: email.trim().toLowerCase(),
        nome: nome.trim(),
        postoGraduacao,
        nivelAcesso,
        estacaoAutorizadaId: nivelAcesso === 'OPERADOR_POSTO' ? estacaoAutorizadaId : undefined,
        sgbAutorizado: nivelAcesso === 'GESTOR_SGB' || nivelAcesso === 'OPERADOR_POSTO' ? sgbAutorizado : undefined,
        ativo: true,
      });

      setEmail('');
      setNome('');
      setIsAdding(false);
      showNotification(`Novo acesso autorizado com sucesso para ${nome.trim()}!`);
    } catch (err: any) {
      setError(err.message || 'Erro ao autorizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: Usuario) => {
    if (user.email === '6gb3sgbadm@gmail.com') {
      alert('Não é permitido desativar o Administrador Geral Master (6gb3sgbadm@gmail.com).');
      return;
    }
    try {
      const nextStatus = !user.ativo;
      await onUpdateUser(user.id, { ativo: nextStatus });
      showNotification(`Status do militar ${user.nome} alterado para ${nextStatus ? 'Ativo' : 'Bloqueado'}`);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (user: Usuario) => {
    if (user.email === '6gb3sgbadm@gmail.com') {
      alert('Não é permitido revogar o Gestor de Tudo (Administrador Geral Master: 6gb3sgbadm@gmail.com)');
      return;
    }
    if (confirm(`Confirma revogação do acesso de ${user.email} (${user.nome})? O militar será excluído.`)) {
      try {
        await onDeleteUser(user.id);
        showNotification(`Acesso de ${user.nome} revogado com sucesso.`);
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir usuário');
      }
    }
  };

  const handleSwitchToUser = (user: Usuario) => {
    setCurrentUser(user);
    showNotification(`Sessão alternada para: ${user.nome} (${user.nivelAcesso})`);
  };

  const handleRestoreMaster = () => {
    const master = availableUsers.find((u) => u.email === '6gb3sgbadm@gmail.com') || availableUsers[0];
    if (master) {
      setCurrentUser(master);
      showNotification('Sessão restaurada para Gestor de Tudo (6gb3sgbadm@gmail.com)');
    }
  };

  // Filtered list
  const filteredUsers = availableUsers.filter((u) => {
    const matchesRole = filterRole === 'ALL' || u.nivelAcesso === filterRole;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      u.nome.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.postoGraduacao.toLowerCase().includes(q) ||
      (u.sgbAutorizado && u.sgbAutorizado.toLowerCase().includes(q)) ||
      (u.estacaoAutorizadaId && u.estacaoAutorizadaId.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const isSimulatingNonMaster = currentUser.email !== '6gb3sgbadm@gmail.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Gestão e Liberação de Acessos dos Militares por Gmail
                </h3>
                <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded font-mono border border-red-800/40 font-bold">
                  Painel do Gestor de Tudo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Insira, edite dados, altere permissões ou revogue o acesso de qualquer militar do 6° GB.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Session Bar */}
        <div className="bg-slate-950/80 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sessão Ativa:</span>
            <span className="font-semibold text-slate-100 flex items-center gap-1">
              {currentUser.email === '6gb3sgbadm@gmail.com' ? (
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {currentUser.nome}
            </span>
            <span className="font-mono text-amber-300 text-[11px]">({currentUser.email})</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              {currentUser.nivelAcesso}
            </span>
          </div>

          {isSimulatingNonMaster && (
            <button
              onClick={handleRestoreMaster}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded text-xs font-semibold transition"
              title="Voltar ao Gestor de Tudo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Voltar ao Gestor de Tudo (Master)</span>
            </button>
          )}
        </div>

        {/* Success / Error Feedback Toast */}
        {successMessage && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-lg text-xs flex items-center gap-2 shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-red-950/80 border border-red-800 text-red-200 rounded-lg text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Summary of 4 Access Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="p-2.5 border border-emerald-900/60 rounded-lg bg-emerald-950/20">
              <div className="flex items-center justify-between text-emerald-400 font-bold mb-0.5">
                <span className="flex items-center gap-1 text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>1. Operador Posto</span>
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-900/80 text-emerald-200">1 Posto</span>
              </div>
              <p className="text-[10px] text-slate-300">
                Inclusão, exclusão e edição de materiais <strong>estritamente</strong> do seu posto de bombeiros.
              </p>
            </div>

            <div className="p-2.5 border border-blue-900/60 rounded-lg bg-blue-950/20">
              <div className="flex items-center justify-between text-blue-400 font-bold mb-0.5">
                <span className="flex items-center gap-1 text-[11px]">
                  <Shield className="w-3.5 h-3.5" />
                  <span>2. Visualizador SGB</span>
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-blue-900/80 text-blue-200">Regional</span>
              </div>
              <p className="text-[10px] text-slate-300">
                Visualiza todos os postos pertencentes ao seu SGB (ex: 3° SGB Litoral Sul).
              </p>
            </div>

            <div className="p-2.5 border border-purple-900/60 rounded-lg bg-purple-950/20">
              <div className="flex items-center justify-between text-purple-400 font-bold mb-0.5">
                <span className="flex items-center gap-1 text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>3. Visualizador GB</span>
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/80 text-purple-200">Sem Edição</span>
              </div>
              <p className="text-[10px] text-slate-300">
                Visualiza o 6° GB todo, mapas e relatórios, sem permissão de alteração operacional.
              </p>
            </div>

            <div className="p-2.5 border border-red-900/60 rounded-lg bg-red-950/30 ring-1 ring-red-500/30">
              <div className="flex items-center justify-between text-red-400 font-bold mb-0.5">
                <span className="flex items-center gap-1 text-[11px]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>4. Gestor de Tudo</span>
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-red-900 text-white font-black">Total</span>
              </div>
              <p className="text-[10px] text-slate-300">
                Acesso master: editar, excluir, autorizar acessos, gerenciar postos e todo o SIGMA-CB.
              </p>
            </div>
          </div>

          {/* EDIT MILITARY USER FORM */}
          {editingUser && (
            <form
              onSubmit={handleSaveEdit}
              className="bg-slate-950 border-2 border-amber-500/50 rounded-xl p-4 space-y-3.5 shadow-xl animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Editar Militar: <span className="text-amber-300 font-mono">{editingUser.email}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Modifique dados pessoais, graduação, nível de acesso e posto atribuído.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Gmail Autorizado do Militar: *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    disabled={editingUser.email === '6gb3sgbadm@gmail.com'}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono font-semibold focus:outline-none focus:border-amber-500 ${
                      editingUser.email === '6gb3sgbadm@gmail.com' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  {editingUser.email === '6gb3sgbadm@gmail.com' && (
                    <span className="text-[10px] text-amber-400">O Gmail do Gestor Master não pode ser modificado.</span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nome Completo do Militar / Encarregado: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Posto / Graduação:
                  </label>
                  <select
                    value={editPostoGraduacao}
                    onChange={(e) => setEditPostoGraduacao(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {POSTOS_GRADUACOES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nível de Acesso:
                  </label>
                  <select
                    value={editNivelAcesso}
                    onChange={(e) => setEditNivelAcesso(e.target.value as UserRole)}
                    disabled={editingUser.email === '6gb3sgbadm@gmail.com'}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold ${
                      editingUser.email === '6gb3sgbadm@gmail.com' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="OPERADOR_POSTO">1. Operador do Posto</option>
                    <option value="GESTOR_SGB">2. Visualizador de SGB</option>
                    <option value="VISUALIZADOR_GB">3. Visualizador do GB Todo</option>
                    <option value="SUPERADMIN">4. Gestor de Tudo (Master)</option>
                  </select>
                </div>

                {(editNivelAcesso === 'GESTOR_SGB' || editNivelAcesso === 'OPERADOR_POSTO') && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      SGB de Vinculação:
                    </label>
                    <select
                      value={editSgb}
                      onChange={(e) => {
                        const newSgb = e.target.value as SgbId;
                        setEditSgb(newSgb);
                        const firstSt = stations.find((s) => s.sgb === newSgb);
                        if (firstSt) setEditEstacaoId(firstSt.id);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                    >
                      <option value="1° SGB">1° SGB (Santos e Região)</option>
                      <option value="2° SGB">2° SGB (Cubatão, Guarujá, Bertioga)</option>
                      <option value="3° SGB">3° SGB (São Vicente, PG, Mongaguá, etc.)</option>
                      <option value="4° SGB">4° SGB (Vale do Ribeira / Registro)</option>
                    </select>
                  </div>
                )}

                {editNivelAcesso === 'OPERADOR_POSTO' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Posto Vinculado Exclusivo:
                    </label>
                    <select
                      value={editEstacaoId}
                      onChange={(e) => setEditEstacaoId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300 focus:outline-none focus:border-amber-500 font-semibold"
                    >
                      {stations
                        .filter((st) => !editSgb || st.sgb === editSgb)
                        .map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.nome} ({st.cidade})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Situação do Acesso:
                  </label>
                  <select
                    value={editAtivo ? 'ATIVO' : 'BLOQUEADO'}
                    onChange={(e) => setEditAtivo(e.target.value === 'ATIVO')}
                    disabled={editingUser.email === '6gb3sgbadm@gmail.com'}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-semibold ${
                      editAtivo ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    <option value="ATIVO">Ativo (Permitido)</option>
                    <option value="BLOQUEADO">Bloqueado (Suspenso)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs shadow transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? 'Salvando...' : 'Salvar Alterações do Militar'}</span>
                </button>
              </div>
            </form>
          )}

          {/* INSERT NEW MILITARY FORM */}
          {isAdding && !editingUser && (
            <form
              onSubmit={handleCreateUser}
              className="bg-slate-950 border border-red-500/40 rounded-xl p-4 space-y-3.5 shadow-xl animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-red-600/20 flex items-center justify-center text-red-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Autorizar e Inserir Novo Militar por Gmail
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Cadastre o Gmail do militar e vincule ao respectivo posto ou escalão de comando.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Gmail do Militar / Posto: *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: bombeiro.saovicente@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono font-semibold focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nome Completo do Militar: *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Posto / Graduação:
                  </label>
                  <select
                    value={postoGraduacao}
                    onChange={(e) => setPostoGraduacao(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
                  >
                    {POSTOS_GRADUACOES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tipo de Acesso a Conceder:
                  </label>
                  <select
                    value={nivelAcesso}
                    onChange={(e) => setNivelAcesso(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-bold"
                  >
                    <option value="OPERADOR_POSTO">1. Operador do Posto (Inclusão/Edição/Exclusão do seu posto)</option>
                    <option value="GESTOR_SGB">2. Visualizador de SGB (Todos os postos do seu SGB)</option>
                    <option value="VISUALIZADOR_GB">3. Visualizador do GB Todo (Apenas visualiza, sem edição)</option>
                    <option value="SUPERADMIN">4. Gestor de Tudo (Acesso Total)</option>
                  </select>
                </div>

                {(nivelAcesso === 'GESTOR_SGB' || nivelAcesso === 'OPERADOR_POSTO') && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      SGB de Vinculação:
                    </label>
                    <select
                      value={sgbAutorizado}
                      onChange={(e) => {
                        const newSgb = e.target.value as SgbId;
                        setSgbAutorizado(newSgb);
                        const firstSt = stations.find((s) => s.sgb === newSgb);
                        if (firstSt) setEstacaoAutorizadaId(firstSt.id);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-bold"
                    >
                      <option value="1° SGB">1° SGB (Santos e Região)</option>
                      <option value="2° SGB">2° SGB (Cubatão, Guarujá, Bertioga)</option>
                      <option value="3° SGB">3° SGB (São Vicente, PG, Mongaguá, etc.)</option>
                      <option value="4° SGB">4° SGB (Vale do Ribeira / Registro)</option>
                    </select>
                  </div>
                )}

                {nivelAcesso === 'OPERADOR_POSTO' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Posto Vinculado Exclusivo:
                    </label>
                    <select
                      value={estacaoAutorizadaId}
                      onChange={(e) => setEstacaoAutorizadaId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-300 focus:outline-none focus:border-red-500 font-semibold"
                    >
                      {stations
                        .filter((st) => !sgbAutorizado || st.sgb === sgbAutorizado)
                        .map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.nome} ({st.cidade})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs shadow transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? 'Cadastrando...' : 'Liberar e Ativar Acesso'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Action Header & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar militar por nome, email ou posto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Role filter chips */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-red-500"
              >
                <option value="ALL">Todos os Níveis ({availableUsers.length})</option>
                <option value="OPERADOR_POSTO">1. Operadores de Posto</option>
                <option value="GESTOR_SGB">2. Visualizadores SGB</option>
                <option value="VISUALIZADOR_GB">3. Visualizadores GB</option>
                <option value="SUPERADMIN">4. Gestores de Tudo</option>
              </select>
            </div>

            {!isAdding && !editingUser && (
              <button
                onClick={() => {
                  setIsAdding(true);
                  setError(null);
                }}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition shadow-md shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Inserir Novo Militar / Acesso</span>
              </button>
            )}
          </div>

          {/* MILITARY USERS TABLE */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">E-MAIL / GMAIL AUTORIZADO</th>
                    <th className="py-2.5 px-3">NOME / GRADUAÇÃO</th>
                    <th className="py-2.5 px-3">NÍVEL DE ACESSO</th>
                    <th className="py-2.5 px-3">ESCOPO AUTORIZADO</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhum militar localizado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isMaster = u.email === '6gb3sgbadm@gmail.com';
                      const targetStation = stations.find((s) => s.id === u.estacaoAutorizadaId);
                      const isCurrent = currentUser.id === u.id;
                      const isBeingEdited = editingUser?.id === u.id;

                      return (
                        <tr
                          key={u.id}
                          className={`transition ${
                            isBeingEdited
                              ? 'bg-amber-950/20'
                              : isCurrent
                              ? 'bg-slate-900/60'
                              : 'hover:bg-slate-900/40'
                          }`}
                        >
                          {/* Email */}
                          <td className="py-2.5 px-3 font-mono font-medium text-amber-300">
                            <div className="flex items-center gap-1.5">
                              {isMaster ? (
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-600" />
                              )}
                              <span>{u.email}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-red-950 text-red-200 px-1.5 py-0.2 rounded border border-red-700 font-bold">
                                  VOCÊ
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Nome / Posto */}
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-100">{u.nome}</div>
                            <div className="text-[10px] text-slate-400">{u.postoGraduacao}</div>
                          </td>

                          {/* Nível de Acesso */}
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                u.nivelAcesso === 'SUPERADMIN'
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : u.nivelAcesso === 'GESTOR_SGB'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : u.nivelAcesso === 'VISUALIZADOR_GB'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {u.nivelAcesso}
                            </span>
                          </td>

                          {/* Escopo */}
                          <td className="py-2.5 px-3">
                            {u.nivelAcesso === 'OPERADOR_POSTO' ? (
                              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{targetStation ? targetStation.nome : u.estacaoAutorizadaId || 'EB São Vicente'}</span>
                              </span>
                            ) : u.nivelAcesso === 'GESTOR_SGB' ? (
                              <span className="text-blue-300 font-medium">
                                {u.sgbAutorizado || '3° SGB'} (Postos Subordinados)
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                6° GB Todo (Todas as 19 Estações)
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={isMaster}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                                u.ativo
                                  ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/50'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                              } ${isMaster ? 'cursor-not-allowed opacity-80' : ''}`}
                              title={isMaster ? 'Master sempre ativo' : 'Clique para alterar status'}
                            >
                              {u.ativo ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span>Ativo</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-slate-500" />
                                  <span>Bloqueado</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Ações (EDITAR, TESTAR, EXCLUIR) */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* EDIT BUTTON */}
                              <button
                                onClick={() => startEditing(u)}
                                className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[11px] font-semibold transition"
                                title="Editar dados, graduação ou permissões deste militar"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>

                              {/* SIMULAR / TESTAR */}
                              <button
                                onClick={() => handleSwitchToUser(u)}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] transition"
                                title="Simular a visão deste militar"
                              >
                                <LogIn className="w-3 h-3 text-amber-400" />
                                <span className="hidden sm:inline">Testar</span>
                              </button>

                              {/* DELETE BUTTON */}
                              {!isMaster && (
                                <button
                                  onClick={() => handleDelete(u)}
                                  className="p-1 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded transition border border-transparent hover:border-red-800"
                                  title="Revogar e excluir militar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Total de militares autorizados: <strong className="text-white">{availableUsers.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
