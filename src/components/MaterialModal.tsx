/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MaterialOperacional, FireStation, CategoriaMaterial, MaterialStatus, EstadoConservacao } from '../types';
import { OFFICIAL_CATEGORIES, OFFICIAL_SGBS, CATEGORIAS_COM_VALIDADE } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import { X, Save, AlertCircle, Tag } from 'lucide-react';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<MaterialOperacional>) => Promise<void>;
  materialToEdit: MaterialOperacional | null;
  stations: FireStation[];
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  materialToEdit,
  stations,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [patrimonio, setPatrimonio] = useState('');
  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [status, setStatus] = useState<MaterialStatus>('OPERANDO');
  const [categoria, setCategoria] = useState<CategoriaMaterial>('COMPRESSOR');
  const [estacaoId, setEstacaoId] = useState('');
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacao>('EXCELENTE');
  const [localizacaoInterna, setLocalizacaoInterna] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [proximaManutencao, setProximaManutencao] = useState('');
  const [periodicidadeMeses, setPeriodicidadeMeses] = useState(3);
  const [responsavelConferencia, setResponsavelConferencia] = useState('');
  const [observacao, setObservacao] = useState('');

  const isOperatorLocked = currentUser.nivelAcesso === 'OPERADOR_POSTO';

  useEffect(() => {
    if (materialToEdit) {
      setPatrimonio(materialToEdit.patrimonio || '');
      setTipo(materialToEdit.tipo || '');
      setMarca(materialToEdit.marca || '');
      setModelo(materialToEdit.modelo || '');
      setStatus(materialToEdit.status || 'OPERANDO');
      setCategoria(materialToEdit.categoria || 'COMPRESSOR');
      setEstacaoId(materialToEdit.estacaoId || stations[0]?.id || '');
      setEstadoConservacao(materialToEdit.estadoConservacao || 'BOM');
      setLocalizacaoInterna(materialToEdit.localizacaoInterna || '');
      setNumeroSerie(materialToEdit.numeroSerie || '');
      setDataAquisicao(materialToEdit.dataAquisicao || '');
      setDataValidade(materialToEdit.dataValidade || '');
      setProximaManutencao(materialToEdit.proximaManutencao || '');
      setPeriodicidadeMeses(materialToEdit.periodicidadeMeses || 3);
      setResponsavelConferencia(materialToEdit.responsavelConferencia || currentUser.nome);
      setObservacao(materialToEdit.observacao || '');
    } else {
      setPatrimonio(`CB-MO-${Math.floor(1000 + Math.random() * 9000)}`);
      setTipo('');
      setMarca('');
      setModelo('');
      setStatus('OPERANDO');
      setCategoria('COMPRESSOR');
      const defaultSt = isOperatorLocked
        ? currentUser.estacaoAutorizadaId || 'eb-sao-vicente'
        : 'eb-sao-vicente';
      setEstacaoId(defaultSt);
      setEstadoConservacao('EXCELENTE');
      setLocalizacaoInterna('Viatura ABMT');
      setNumeroSerie('');
      setDataAquisicao(new Date().toISOString().split('T')[0]);
      setDataValidade('');
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 3);
      setProximaManutencao(nextDate.toISOString().split('T')[0]);
      setPeriodicidadeMeses(3);
      setResponsavelConferencia(currentUser.nome);
      setObservacao('');
    }
    setError(null);
  }, [materialToEdit, isOpen, currentUser, stations, isOperatorLocked]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patrimonio.trim() || !tipo.trim()) {
      setError('Patrimônio e Tipo/Descrição são campos obrigatórios');
      return;
    }

    const selectedSt = stations.find((s) => s.id === estacaoId) || stations[0];

    const requerValidade = CATEGORIAS_COM_VALIDADE.includes(categoria);

    try {
      setLoading(true);
      setError(null);
      await onSave({
        patrimonio: patrimonio.trim(),
        tipo: tipo.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        status,
        categoria,
        estacaoId: selectedSt.id,
        estacao: selectedSt.nome,
        sgb: selectedSt.sgb,
        estadoConservacao,
        localizacaoInterna: localizacaoInterna.trim(),
        numeroSerie: numeroSerie.trim(),
        dataAquisicao: dataAquisicao || undefined,
        dataValidade: requerValidade ? (dataValidade || undefined) : undefined,
        proximaManutencao: proximaManutencao || undefined,
        periodicidadeMeses: Number(periodicidadeMeses) || 3,
        responsavelConferencia: responsavelConferencia.trim(),
        observacao: observacao.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-white">
              {materialToEdit ? 'Editar Material Operacional' : 'Novo Cadastro de Material Unitário'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-200 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Posto e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Posto de Bombeiro:
              </label>
              <select
                value={estacaoId}
                disabled={isOperatorLocked}
                onChange={(e) => setEstacaoId(e.target.value)}
                className={`w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 ${
                  isOperatorLocked ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {OFFICIAL_SGBS.map((sgb) => {
                  const sgbStations = stations.filter((s) => s.sgb === sgb);
                  return (
                    <optgroup key={sgb} label={sgb}>
                      {sgbStations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} ({s.cidade})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Aba da Planilha (Categoria Oficial):
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaMaterial)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-semibold"
              >
                {OFFICIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dados Principais: Patrimônio, Tipo, Marca, Modelo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label className="block text-slate-300 font-semibold mb-1">
                PATRIMÔNIO: *
              </label>
              <input
                type="text"
                required
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
                placeholder="Ex: CB-3SGB-0105"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-300 font-semibold mb-1">
                MATERIAL / TIPO: *
              </label>
              <input
                type="text"
                required
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: Compressor de Ar Respirável, Motosserra MS 382..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">MARCA:</label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Coltri, Scott, Holmatro, Stihl..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">MODELO:</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: MCH-16/ET, ProPak-f, Pentheon..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>
          </div>

          {/* Status e Estado de Conservação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                STATUS OPERACIONAL:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaterialStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold"
              >
                <option value="OPERANDO">OPERANDO (Disponível)</option>
                <option value="BAIXADO">BAIXADO (Inservível)</option>
                <option value="EM MANUTENÇÃO">EM MANUTENÇÃO</option>
                <option value="RESERVA">RESERVA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                ESTADO DE CONSERVAÇÃO:
              </label>
              <select
                value={estadoConservacao}
                onChange={(e) => setEstadoConservacao(e.target.value as EstadoConservacao)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-medium"
              >
                <option value="EXCELENTE">Excelente</option>
                <option value="BOM">Bom</option>
                <option value="REGULAR">Regular</option>
                <option value="DANIFICADO/INSERVÍVEL">Danificado / Inservível</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Localização / Viatura:
              </label>
              <input
                type="text"
                value={localizacaoInterna}
                onChange={(e) => setLocalizacaoInterna(e.target.value)}
                placeholder="Ex: Viatura ABMT, UR, Almoxarifado"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
              />
            </div>
          </div>

          {/* Validade e Manutenção Preventiva */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              {CATEGORIAS_COM_VALIDADE.includes(categoria) ? (
                <>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>{categoria === 'CILINDROS' ? 'Teste Hidrostático:' : 'Data de Validade:'}</span>
                    <span className="text-[10px] text-amber-400 font-normal">Requerido</span>
                  </label>
                  <input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </>
              ) : (
                <>
                  <label className="block text-slate-500 font-semibold mb-1">
                    Validade / Teste Hidrostático:
                  </label>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-500 text-xs italic">
                    Não aplicável ({categoria})
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Próxima Manutenção Preventiva:
              </label>
              <input
                type="date"
                value={proximaManutencao}
                onChange={(e) => setProximaManutencao(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Periodicidade (meses):
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={periodicidadeMeses}
                onChange={(e) => setPeriodicidadeMeses(parseInt(e.target.value, 10) || 3)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
              />
            </div>
          </div>

          {/* Observação da Planilha */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              OBSERVAÇÃO (Campo oficial da Planilha):
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva detalhes operacionais do material..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white font-semibold rounded-lg shadow transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : 'Salvar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
