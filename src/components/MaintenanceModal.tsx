/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaterialOperacional, MaterialStatus, EstadoConservacao } from '../types';
import { useAuth } from '../context/AuthContext';
import { Wrench, CheckCircle2, XCircle, AlertTriangle, X, ShieldAlert, History } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialOperacional | null;
  onConfirm: (payload: {
    tipo: string;
    descricao: string;
    responsavel: string;
    novoStatus?: MaterialStatus;
    novoEstadoConservacao?: EstadoConservacao;
    proximaData?: string;
  }) => Promise<void>;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  material,
  onConfirm,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tipoAcao, setTipoAcao] = useState<'PREVENTIVA' | 'CORRETIVA' | 'BAIXA' | 'RETORNO_OPERACAO' | 'INSPECAO'>('PREVENTIVA');
  const [novoStatus, setNovoStatus] = useState<MaterialStatus>(material?.status || 'OPERANDO');
  const [novoEstado, setNovoEstado] = useState<EstadoConservacao>(material?.estadoConservacao || 'EXCELENTE');
  const [descricao, setDescricao] = useState('');
  const [proximaData, setProximaData] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (material?.periodicidadeMeses || 3));
    return d.toISOString().split('T')[0];
  });
  const [responsavel, setResponsavel] = useState(currentUser.nome);

  if (!isOpen || !material) return null;

  const handleActionChange = (action: typeof tipoAcao) => {
    setTipoAcao(action);
    if (action === 'PREVENTIVA' || action === 'INSPECAO') {
      setNovoStatus('OPERANDO');
      setNovoEstado('EXCELENTE');
      setDescricao('Manutenção preventiva periódica executada conforme POP e checklist.');
    } else if (action === 'CORRETIVA') {
      setNovoStatus('EM MANUTENÇÃO');
      setNovoEstado('REGULAR');
      setDescricao('Equipamento enviado para reparo na oficina/DMM por falha operacional.');
    } else if (action === 'BAIXA') {
      setNovoStatus('BAIXADO');
      setNovoEstado('DANIFICADO/INSERVÍVEL');
      setDescricao('Baixa definitiva de carga por danos irreparáveis ou fim de vida útil.');
    } else if (action === 'RETORNO_OPERACAO') {
      setNovoStatus('OPERANDO');
      setNovoEstado('BOM');
      setDescricao('Retorno do equipamento da oficina/DMM 100% revisado e testado.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onConfirm({
        tipo: tipoAcao,
        descricao: descricao.trim() || `Registro de ${tipoAcao}`,
        responsavel: responsavel.trim() || currentUser.nome,
        novoStatus,
        novoEstadoConservacao: novoEstado,
        proximaData: tipoAcao !== 'BAIXA' ? proximaData : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Registro de Manutenção & Inspeção Operacional
              </h3>
              <p className="text-xs text-slate-400">
                {material.patrimonio} • {material.tipo} ({material.estacao})
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Action Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Tipo de Operação:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleActionChange('PREVENTIVA')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  tipoAcao === 'PREVENTIVA'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] uppercase font-bold">Rotina</span>
                </div>
                <span className="font-semibold text-xs text-white">Preventiva</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionChange('CORRETIVA')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  tipoAcao === 'CORRETIVA'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] uppercase font-bold">Oficina</span>
                </div>
                <span className="font-semibold text-xs text-white">Enviar Reparo</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionChange('RETORNO_OPERACAO')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  tipoAcao === 'RETORNO_OPERACAO'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] uppercase font-bold">Pronto</span>
                </div>
                <span className="font-semibold text-xs text-white">Retorno da DMM</span>
              </button>

              <button
                type="button"
                onClick={() => handleActionChange('BAIXA')}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                  tipoAcao === 'BAIXA'
                    ? 'bg-red-950/60 border-red-500 text-red-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-[10px] uppercase font-bold">Descarga</span>
                </div>
                <span className="font-semibold text-xs text-white">Baixar Material</span>
              </button>
            </div>
          </div>

          {/* New Status and Conservation Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Novo Status Operacional:</label>
              <select
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value as MaterialStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-semibold"
              >
                <option value="OPERANDO">OPERANDO (Disponível)</option>
                <option value="EM MANUTENÇÃO">EM MANUTENÇÃO (Oficina)</option>
                <option value="BAIXADO">BAIXADO (Inservível)</option>
                <option value="RESERVA">RESERVA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Estado de Conservação:</label>
              <select
                value={novoEstado}
                onChange={(e) => setNovoEstado(e.target.value as EstadoConservacao)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
              >
                <option value="EXCELENTE">Excelente</option>
                <option value="BOM">Bom</option>
                <option value="REGULAR">Regular</option>
                <option value="DANIFICADO/INSERVÍVEL">Danificado / Inservível</option>
              </select>
            </div>
          </div>

          {/* Description and Reason */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {tipoAcao === 'BAIXA' ? 'Motivo da Baixa (Boletim Interno / Laudo):' : 'Descrição dos Serviços Realizados / Checklist:'}
            </label>
            <textarea
              rows={3}
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhes como troca de filtro, medição de pressão, troca de baterias, óleo, laudo..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Next Preventive Maintenance & Officer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tipoAcao !== 'BAIXA' ? (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Próxima Manutenção Preventiva Agendada:
                </label>
                <input
                  type="date"
                  value={proximaData}
                  onChange={(e) => setProximaData(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            ) : (
              <div className="bg-red-950/40 p-2.5 rounded border border-red-900/60 text-red-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>O item baixado será retirado do cálculo de prontidão operacional.</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Responsável pelo Procedimento:
              </label>
              <input
                type="text"
                required
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: 1° Sgt PM Alves"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* History Snippet */}
          {material.historico && material.historico.length > 0 && (
            <div className="border-t border-slate-800 pt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                <History className="w-3.5 h-3.5" />
                Histórico Anterior de Manutenções:
              </span>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {material.historico.map((h) => (
                  <div
                    key={h.id}
                    className="bg-slate-950/70 p-2 rounded text-[11px] border border-slate-800 flex justify-between"
                  >
                    <div>
                      <span className="text-amber-400 font-medium">[{h.tipo}]</span>{' '}
                      <span className="text-slate-300">{h.descricao}</span>
                    </div>
                    <span className="text-slate-500 shrink-0 ml-2">{h.data}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-slate-950 font-bold rounded-lg text-xs shadow-lg transition"
            >
              <Wrench className="w-4 h-4" />
              <span>{loading ? 'Processando...' : 'Confirmar Manutenção'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
