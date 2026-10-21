/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FireStation } from '../types';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: FireStation[];
  onImport: (csvText: string, stationId: string) => Promise<{ success: boolean; count: number }>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  stations,
  onImport,
}) => {
  const [stationId, setStationId] = useState(stations[0]?.id || 'eb-sao-vicente');
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      setError('Insira ou anexe o conteúdo do arquivo CSV');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await onImport(csvContent, stationId);
      setSuccessMsg(`Sucesso! ${res.count} materiais foram importados para a carga operacional.`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setCsvContent('');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Erro durante importação');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleTemplate = () => {
    const sample = `EQUIPAMENTOS OPERANDO,,,2,,,,
EQUIPAMENTOS BAIXADO,,,0,,,,

PATRIMÔNIO,TIPO,MARCA,MODELO,STATUS,SGB,ESTAÇÃO,OBSERVAÇÃO,CATEGORIA
CB-3SGB-9001,Compressor de Ar Respirável Mako,Mako,5000 PSI,OPERANDO,3° SGB,EB São Vicente,Filtro e óleo novos,COMPRESSORES
CB-3SGB-9002,Conjunto Desencarcerador Pentheon,Holmatro,PSP40 / PCU50,OPERANDO,3° SGB,EB São Vicente,Baterias 100% carregadas,DESENCARCERADORES`;
    setCsvContent(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Importação de Planilha de Materiais (M.O.)
              </h3>
              <p className="text-xs text-slate-400">
                Compatível com a planilha do Corpo de Bombeiros (EB São Vicente / 3° SGB)
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

        <form onSubmit={handleImportSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-200 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-200 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Target Station */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Estação de Bombeiros Destino:
            </label>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.sgb})
                </option>
              ))}
            </select>
          </div>

          {/* File input / Paste area */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">
                Anexe o arquivo CSV ou cole o conteúdo da planilha:
              </label>
              <button
                type="button"
                onClick={loadSampleTemplate}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline"
              >
                Preencher modelo de exemplo
              </button>
            </div>

            <div className="mb-2">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Cole aqui o texto CSV com o cabeçalho PATRIMÔNIO,TIPO,MARCA,MODELO,STATUS,SGB,ESTAÇÃO,OBSERVAÇÃO..."
              className="w-full font-mono bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            <strong>Colunas esperadas no cabeçalho:</strong>
            <div className="font-mono text-slate-300 mt-1">
              PATRIMÔNIO, TIPO, MARCA, MODELO, STATUS, SGB, ESTAÇÃO, OBSERVAÇÃO
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !csvContent.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-lg text-xs shadow-lg transition"
            >
              <Upload className="w-4 h-4" />
              <span>{loading ? 'Importando...' : 'Processar e Importar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
