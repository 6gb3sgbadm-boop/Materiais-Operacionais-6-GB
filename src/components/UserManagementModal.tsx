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
  ShieldCheck,
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
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: FireStation[];
  onAddUser: (user: Partial<Usuario>) => Promise<void>;
  onUpdateUser: (id: string, user: Partial<Usuario>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

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

  // New user form state
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [postoGraduacao, setPostoGraduacao] = useState('1° Sargento PM');
  const [nivelAcesso, setNivelAcesso] = useState<UserRole>('OPERADOR_POSTO');
  const [estacaoAutorizadaId, setEstacaoAutorizadaId] = useState(stations[0]?.id || 'eb-sao-vicente');
  const [sgbAutorizado, setSgbAutorizado] = useState<SgbId>('3° SGB');

  if (!isOpen) return null;

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
      });
      setEmail('');
      setNome('');
      setIsAdding(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao autorizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: Usuario) => {
    if (user.email === '6gb3sgbadm@gmail.com') return; // Cannot disable master
    try {
      await onUpdateUser(user.id, { ativo: !user.ativo });
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (user: Usuario) => {
    if (user.email === '6gb3sgbadm@gmail.com') {
      alert('Não é permitido revogar o Gestor de Tudo (Administrador Geral Master)');
      return;
    }
    if (confirm(`Confirma revogação do acesso de ${user.email} (${user.nome})?`)) {
      try {
        await onDeleteUser(user.id);
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir usuário');
      }
    }
  };

  const handleSwitchToUser = (user: Usuario) => {
    setCurrentUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Gestão e Liberação dos 4 Níveis de Acesso por Gmail</span>
                <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded font-mono border border-red-800/40 font-bold">
                  Painel do Gestor de Tudo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Libere e configure acessos individuais por Gmail para cada posto, SGB e comando central do 6° GB.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* Detailed Summary of the 4 Access Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            {/* 1. Operador do Posto */}
            <div className="p-3 border border-emerald-900/60 rounded-lg bg-emerald-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>1. Operador do Posto</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200">
                    1 Gmail/Posto
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  <strong>Funções do posto cadastrado:</strong> inclusão, exclusão e edição de materiais <em>APENAS</em> do seu posto determinado por Gmail (ex: EB São Vicente).
                </p>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-2 pt-2 border-t border-emerald-900/40">
                ✓ Posto travado automaticamente
              </div>
            </div>

            {/* 2. Visualizador do SGB */}
            <div className="p-3 border border-blue-900/60 rounded-lg bg-blue-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-blue-400 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>2. Visualizador SGB</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-900/80 text-blue-200">
                    Regional
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  Visualiza todos os postos do SGB que lhe é pertinente (3° SGB), determinado por Gmail específico liberado pelo Gestor.
                </p>
              </div>
              <div className="text-[10px] text-blue-400 font-medium mt-2 pt-2 border-t border-blue-900/40">
                ✓ Visualiza postos subordinados
              </div>
            </div>

            {/* 3. Visualizador do GB Todo */}
            <div className="p-3 border border-purple-900/60 rounded-lg bg-purple-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-purple-400 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>3. Visualizador GB</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/80 text-purple-200">
                    Sem Edição
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  Visualiza o GB todo (todas as estações), mas <em>apenas visualiza</em> sem necessidade de edição: olhar tudo, gerar relatórios e mapa de materiais.
                </p>
              </div>
              <div className="text-[10px] text-purple-400 font-medium mt-2 pt-2 border-t border-purple-900/40">
                ✓ Consulta tática e relatórios
              </div>
            </div>

            {/* 4. Gestor de Tudo (SuperAdmin) */}
            <div className="p-3 border border-red-900/60 rounded-lg bg-red-950/30 flex flex-col justify-between ring-1 ring-red-500/30">
              <div>
                <div className="flex items-center justify-between text-red-400 font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>4. Gestor de Tudo</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-900 text-white font-black">
                    Único
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                  Acesso único e exclusivo do Administrador (<strong>6gb3sgbadm@gmail.com</strong>): alterar, editar, excluir e incluir acessos, postos, materiais e tudo mais.
                </p>
              </div>
              <div className="text-[10px] text-red-400 font-medium mt-2 pt-2 border-t border-red-900/40">
                ✓ Controle total e irrestrito
              </div>
            </div>
          </div>

          {/* Form to Authorize New Gmail */}
          {isAdding ? (
            <form onSubmit={handleCreateUser} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-red-400" />
                  <span>Autorizar e Liberar Novo Acesso por Gmail</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              {error && (
                <div className="p-2.5 bg-red-950/80 border border-red-800 text-red-200 rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Gmail Autorizado do Quartel / Militar: *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: eb.saovicente@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-red-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nome do Militar / Encarregado: *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500"
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
                    <option value="Coronel PM">Coronel PM</option>
                    <option value="Tenente-Coronel PM">Tenente-Coronel PM</option>
                    <option value="Major PM">Major PM</option>
                    <option value="Capitão PM">Capitão PM</option>
                    <option value="1° Tenente PM">1° Tenente PM</option>
                    <option value="2° Tenente PM">2° Tenente PM</option>
                    <option value="Subtenente PM">Subtenente PM</option>
                    <option value="1° Sargento PM">1° Sargento PM</option>
                    <option value="2° Sargento PM">2° Sargento PM</option>
                    <option value="3° Sargento PM">3° Sargento PM</option>
                    <option value="Cabo PM">Cabo PM</option>
                    <option value="Soldado PM">Soldado PM</option>
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
                    <option value="SUPERADMIN">4. Gestor de Tudo (Acesso Total e Irrestrito)</option>
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
                        const newSgb = e.target.value as any;
                        setSgbAutorizado(newSgb);
                        const firstStInSgb = stations.find((s) => s.sgb === newSgb);
                        if (firstStInSgb) setEstacaoAutorizadaId(firstStInSgb.id);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-bold"
                    >
                      <option value="1° SGB">1° SGB (Santos e Região)</option>
                      <option value="2° SGB">2° SGB (Cubatão, Guarujá, Bertioga)</option>
                      <option value="3° SGB">3° SGB (São Vicente, PG, Mongaguá, Itanhaém, Peruíbe)</option>
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded text-xs shadow"
                >
                  {loading ? 'Salvando...' : 'Liberar e Ativar Acesso'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-300">
                Logins e Gmails Autorizados ({availableUsers.length}):
              </span>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Autorizar Novo Gmail / Posto</span>
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                    <th className="py-2.5 px-3">E-MAIL / GMAIL</th>
                    <th className="py-2.5 px-3">NOME / GRADUAÇÃO</th>
                    <th className="py-2.5 px-3">NÍVEL DE ACESSO</th>
                    <th className="py-2.5 px-3">ESCOPO AUTORIZADO</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {availableUsers.map((u) => {
                    const isMaster = u.email === '6gb3sgbadm@gmail.com';
                    const targetStation = stations.find((s) => s.id === u.estacaoAutorizadaId);
                    const isCurrent = currentUser.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-mono font-medium text-amber-300">
                          <div className="flex items-center gap-1.5">
                            {isMaster && <span>👑</span>}
                            <span>{u.email}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-red-950 text-red-200 px-1.5 py-0.2 rounded border border-red-700">
                                VOCÊ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-200">{u.nome}</div>
                          <div className="text-[10px] text-slate-400">{u.postoGraduacao}</div>
                        </td>
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
                        <td className="py-2.5 px-3">
                          {u.nivelAcesso === 'OPERADOR_POSTO' ? (
                            <span className="text-emerald-300 font-semibold flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              <span>{targetStation ? targetStation.nome : u.estacaoAutorizadaId || 'EB São Vicente'}</span>
                            </span>
                          ) : u.nivelAcesso === 'GESTOR_SGB' ? (
                            <span className="text-blue-300 font-medium">
                              {u.sgbAutorizado || '3° SGB'} (Postos Subordinados)
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              6° GB Todo (Todas as Estações)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={isMaster}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                              u.ativo
                                ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
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
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Simular/Testar este Acesso */}
                            <button
                              onClick={() => handleSwitchToUser(u)}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] transition"
                              title="Simular visualização com este nível de acesso"
                            >
                              <LogIn className="w-3 h-3 text-amber-400" />
                              <span className="hidden sm:inline">Testar</span>
                            </button>

                            {!isMaster && (
                              <button
                                onClick={() => handleDelete(u)}
                                className="p-1 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded transition"
                                title="Revogar Acesso"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
