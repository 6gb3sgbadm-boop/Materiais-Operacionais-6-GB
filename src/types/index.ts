/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'SUPERADMIN' | 'GESTOR_SGB' | 'VISUALIZADOR_GB' | 'OPERADOR_POSTO';

export type MaterialStatus = 'OPERANDO' | 'BAIXADO' | 'EM MANUTENÇÃO' | 'RESERVA';

export type EstadoConservacao = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'DANIFICADO/INSERVÍVEL';

export type SgbId = '1° SGB' | '2° SGB' | '3° SGB' | '4° SGB';

export type CategoriaMaterial =
  | 'COMPRESSOR'
  | 'EMBARCAÇÕES'
  | 'EPR'
  | 'CILINDROS'
  | 'MS - MA - MP - SS'
  | 'DESENCARCERADOR'
  | 'EQUIPAMENTOS DIVERSOS'
  | 'ALTURA'
  | 'MERGULHO'
  | 'HIDRAULICA'
  | 'PRODUTOS PERIGOSOS';

export interface FireStation {
  id: string;
  nome: string; // Ex: "SÃO VICENTE", "GONZAGA"
  sgb: SgbId; // 1° SGB, 2° SGB, 3° SGB, 4° SGB
  gb: string; // "6° GB"
  cidade: string;
  endereco: string;
  telefone: string;
  emailPosto: string; // Gmail do quartel
  lat: number;
  lng: number;
  comandante?: string;
  ativa: boolean;
}

export interface HistoricoItem {
  id: string;
  data: string;
  tipo: 'CADASTRO' | 'INSPEÇÃO' | 'MANUTENÇÃO' | 'BAIXA' | 'TRANSFERÊNCIA' | 'CONFERÊNCIA';
  usuario: string;
  descricao: string;
  estadoAnterior?: string;
  estadoNovo?: string;
}

export interface MaterialOperacional {
  id: string;
  // Campos oficiais da planilha
  patrimonio: string;
  tipo: string;
  marca: string;
  modelo: string;
  status: MaterialStatus;
  sgb: SgbId;
  estacao: string; // Nome da estação (ex: "SÃO VICENTE")
  observacao: string;

  // Campos operacionais complementares (sem coluna quantidade, pois cada item é unitário)
  categoria: CategoriaMaterial;
  estacaoId: string;
  estadoConservacao: EstadoConservacao;
  localizacaoInterna?: string; // Viatura, Almoxarifado, Sala de EPR
  numeroSerie?: string;
  dataAquisicao?: string;
  dataValidade?: string;
  ultimaManutencao?: string;
  proximaManutencao?: string;
  periodicidadeMeses?: number;
  responsavelConferencia?: string;
  historico?: HistoricoItem[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  postoGraduacao: string;
  nivelAcesso: UserRole;
  estacaoAutorizadaId?: string; // Obrigatório para OPERADOR_POSTO
  sgbAutorizado?: SgbId; // 1° SGB, 2° SGB, 3° SGB, 4° SGB
  ativo: boolean;
  dataCadastro: string;
  ultimoAcesso?: string;
}

export interface AlertaItem {
  id: string;
  materialId: string;
  patrimonio: string;
  tipoMaterial: string;
  estacao: string;
  sgb: string;
  tipoAlerta: 'VENCIDO' | 'VENCENDO_30_DIAS' | 'MANUTENCAO_VENCIDA' | 'MANUTENCAO_30_DIAS' | 'BAIXADO';
  severidade: 'URGENTE' | 'ALERTA' | 'INFO';
  mensagem: string;
  dataReferencia: string;
  diasRestantes?: number;
}

export interface DashboardStats {
  totalEquipamentos: number;
  operando: number;
  baixado: number;
  emManutencao: number;
  reserva: number;
  indiceProntidao: number;
  alertasCriticos: number;
  vencidos: number;
  vencendo30Dias: number;
  manutencaoPendente: number;
  porCategoria: Record<string, { total: number; operando: number; baixado: number; emManutencao: number }>;
  porEstacao: Record<string, { total: number; operando: number; baixado: number }>;
}
