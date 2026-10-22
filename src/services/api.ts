/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FireStation, MaterialOperacional, Usuario, AlertaItem, DashboardStats } from '../types';
import { INITIAL_USERS, INITIAL_STATIONS, INITIAL_MATERIALS } from '../data/initialData';

const USERS_STORAGE_KEY = 'sigma_users_db_v2';
const STATIONS_STORAGE_KEY = 'sigma_stations_db_v2';
const MATERIALS_STORAGE_KEY = 'sigma_materials_db_v2';

function getStoredUsers(): Usuario[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // fallback
  }
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
  } catch (e) {}
  return [...INITIAL_USERS];
}

function saveStoredUsers(users: Usuario[]) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {}
}

function getStoredStations(): FireStation[] {
  try {
    const raw = localStorage.getItem(STATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...INITIAL_STATIONS];
}

function saveStoredStations(stations: FireStation[]) {
  try {
    localStorage.setItem(STATIONS_STORAGE_KEY, JSON.stringify(stations));
  } catch (e) {}
}

function getStoredMaterials(): MaterialOperacional[] {
  try {
    const raw = localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...INITIAL_MATERIALS];
}

function saveStoredMaterials(materials: MaterialOperacional[]) {
  try {
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
  } catch (e) {}
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const saved = localStorage.getItem('sigma_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.email) {
        headers['x-user-email'] = parsed.email;
      }
    }
  } catch (e) {
    // fallback
  }
  if (!headers['x-user-email']) {
    headers['x-user-email'] = '6gb3sgbadm@gmail.com';
  }
  return headers;
}

export const api = {
  // ================= STATIONS =================
  async getStations(): Promise<FireStation[]> {
    try {
      const res = await fetch('/api/stations', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        saveStoredStations(data);
        return data;
      }
    } catch (e) {
      // offline / static hosting fallback
    }
    return getStoredStations();
  },

  async addStation(data: Partial<FireStation>): Promise<FireStation> {
    let created: FireStation | null = null;
    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        created = await res.json();
      }
    } catch (e) {}

    const stations = getStoredStations();
    if (!created) {
      created = {
        id: data.id || `eb-${Date.now()}`,
        nome: data.nome || 'NOVO POSTO',
        sgb: data.sgb || '3° SGB',
        gb: '6° GB',
        cidade: data.cidade || 'São Vicente',
        endereco: data.endereco || '',
        telefone: data.telefone || '',
        emailPosto: data.emailPosto || '',
        lat: data.lat || -23.9631,
        lng: data.lng || -46.3919,
        comandante: data.comandante || '',
        ativa: data.ativa !== undefined ? data.ativa : true,
      };
    }
    stations.push(created);
    saveStoredStations(stations);
    return created;
  },

  async updateStation(id: string, data: Partial<FireStation>): Promise<FireStation> {
    let updated: FireStation | null = null;
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        updated = await res.json();
      }
    } catch (e) {}

    const stations = getStoredStations();
    const idx = stations.findIndex((s) => s.id === id);
    if (idx !== -1) {
      stations[idx] = { ...stations[idx], ...data, ...(updated || {}) };
      saveStoredStations(stations);
      return stations[idx];
    }
    if (updated) return updated;
    throw new Error('Posto não encontrado');
  },

  // ================= USERS (MILITARES E ACESSOS) =================
  async getUsers(): Promise<Usuario[]> {
    try {
      const res = await fetch('/api/users', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveStoredUsers(data);
          return data;
        }
      }
    } catch (e) {
      // offline / static hosting fallback
    }
    return getStoredUsers();
  },

  async addUser(data: Partial<Usuario>): Promise<Usuario> {
    let created: Usuario | null = null;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        created = await res.json();
      }
    } catch (e) {}

    const users = getStoredUsers();
    if (!created) {
      created = {
        id: `usr-${Date.now()}`,
        email: (data.email || '').trim().toLowerCase(),
        nome: (data.nome || '').trim(),
        postoGraduacao: data.postoGraduacao || 'Bombeiro PM',
        nivelAcesso: data.nivelAcesso || 'OPERADOR_POSTO',
        estacaoAutorizadaId: data.estacaoAutorizadaId,
        sgbAutorizado: data.sgbAutorizado,
        ativo: data.ativo !== undefined ? data.ativo : true,
        dataCadastro: new Date().toISOString().split('T')[0],
        ultimoAcesso: new Date().toISOString().split('T')[0],
      };
    }

    const existsIdx = users.findIndex(
      (u) => u.id === created!.id || u.email.toLowerCase() === created!.email.toLowerCase()
    );
    if (existsIdx !== -1) {
      users[existsIdx] = { ...users[existsIdx], ...created };
    } else {
      users.push(created);
    }
    saveStoredUsers(users);
    return created;
  },

  async updateUser(id: string, data: Partial<Usuario>): Promise<Usuario> {
    let updated: Usuario | null = null;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        updated = await res.json();
      }
    } catch (e) {}

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const isMaster = users[idx].email === '6gb3sgbadm@gmail.com';
      const safeData = { ...data };
      if (isMaster) {
        safeData.email = '6gb3sgbadm@gmail.com';
        safeData.nivelAcesso = 'SUPERADMIN';
        safeData.ativo = true;
      }
      users[idx] = { ...users[idx], ...safeData, ...(updated || {}) };
      saveStoredUsers(users);
      return users[idx];
    }
    if (updated) return updated;
    throw new Error('Usuário não encontrado');
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {}

    const users = getStoredUsers().filter((u) => u.id !== id && u.email !== '6gb3sgbadm@gmail.com');
    saveStoredUsers(users);
  },

  // ================= MATERIALS =================
  async getMaterials(params?: {
    estacaoId?: string;
    sgb?: string;
    categoria?: string;
    status?: string;
    search?: string;
    conservation?: string;
  }): Promise<MaterialOperacional[]> {
    const query = new URLSearchParams();
    if (params?.estacaoId) query.set('estacaoId', params.estacaoId);
    if (params?.sgb) query.set('sgb', params.sgb);
    if (params?.categoria) query.set('categoria', params.categoria);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.conservation) query.set('conservation', params.conservation);

    try {
      const res = await fetch(`/api/materials?${query.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (!params || Object.keys(params).length === 0) {
          saveStoredMaterials(data);
        }
        return data;
      }
    } catch (e) {}

    let list = getStoredMaterials();
    if (params?.estacaoId && params.estacaoId !== 'ALL') {
      list = list.filter((m) => m.estacaoId === params.estacaoId || m.estacao === params.estacaoId);
    }
    if (params?.sgb && params.sgb !== 'ALL') {
      list = list.filter((m) => m.sgb === params.sgb);
    }
    if (params?.categoria && params.categoria !== 'ALL') {
      list = list.filter((m) => m.categoria === params.categoria);
    }
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((m) => m.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.patrimonio.toLowerCase().includes(q) ||
          m.tipo.toLowerCase().includes(q) ||
          m.marca.toLowerCase().includes(q) ||
          m.modelo.toLowerCase().includes(q) ||
          m.observacao.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async createMaterial(data: Partial<MaterialOperacional>): Promise<MaterialOperacional> {
    let created: MaterialOperacional | null = null;
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        created = await res.json();
      }
    } catch (e) {}

    const materials = getStoredMaterials();
    if (!created) {
      created = {
        id: `mat-${Date.now()}`,
        patrimonio: data.patrimonio || `PAT-${Date.now()}`,
        tipo: data.tipo || 'EQUIPAMENTO OPERACIONAL',
        marca: data.marca || 'Padrão PMESP',
        modelo: data.modelo || 'Operacional',
        status: data.status || 'OPERANDO',
        sgb: data.sgb || '3° SGB',
        estacao: data.estacao || 'SÃO VICENTE',
        estacaoId: data.estacaoId || 'eb-sao-vicente',
        observacao: data.observacao || 'Cadastrado no SIGMA-CB.',
        categoria: data.categoria || 'EQUIPAMENTOS DIVERSOS',
        estadoConservacao: data.estadoConservacao || 'BOM',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
    }
    materials.unshift(created);
    saveStoredMaterials(materials);
    return created;
  },

  async updateMaterial(id: string, data: Partial<MaterialOperacional>): Promise<MaterialOperacional> {
    let updated: MaterialOperacional | null = null;
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        updated = await res.json();
      }
    } catch (e) {}

    const materials = getStoredMaterials();
    const idx = materials.findIndex((m) => m.id === id);
    if (idx !== -1) {
      materials[idx] = { ...materials[idx], ...data, ...(updated || {}), atualizadoEm: new Date().toISOString() };
      saveStoredMaterials(materials);
      return materials[idx];
    }
    if (updated) return updated;
    throw new Error('Material não encontrado');
  },

  async deleteMaterial(id: string): Promise<void> {
    try {
      await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {}

    const materials = getStoredMaterials().filter((m) => m.id !== id);
    saveStoredMaterials(materials);
  },

  async registerMaintenance(
    id: string,
    payload: {
      tipo: string;
      descricao: string;
      responsavel: string;
      novoStatus?: string;
      novoEstadoConservacao?: string;
      proximaData?: string;
    }
  ): Promise<MaterialOperacional> {
    let updated: MaterialOperacional | null = null;
    try {
      const res = await fetch(`/api/materials/${id}/maintenance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        updated = await res.json();
      }
    } catch (e) {}

    const materials = getStoredMaterials();
    const idx = materials.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const mat = materials[idx];
      const today = new Date().toISOString().split('T')[0];
      mat.ultimaManutencao = today;
      if (payload.proximaData) mat.proximaManutencao = payload.proximaData;
      if (payload.novoStatus) mat.status = payload.novoStatus as any;
      if (payload.novoEstadoConservacao) mat.estadoConservacao = payload.novoEstadoConservacao as any;
      mat.atualizadoEm = new Date().toISOString();
      saveStoredMaterials(materials);
      return mat;
    }
    if (updated) return updated;
    throw new Error('Material não encontrado');
  },

  // ================= ALERTS & STATS =================
  async getAlerts(): Promise<AlertaItem[]> {
    try {
      const res = await fetch('/api/alerts', { headers: getAuthHeaders() });
      if (res.ok) return res.json();
    } catch (e) {}

    const materials = getStoredMaterials();
    const alerts: AlertaItem[] = [];
    const now = new Date();
    materials.forEach((m) => {
      if (m.dataValidade && ['CILINDROS', 'EPR', 'ALTURA', 'PRODUTOS PERIGOSOS'].includes(m.categoria)) {
        const valDate = new Date(m.dataValidade + 'T00:00:00');
        const diffDays = Math.ceil((valDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          alerts.push({
            id: `alert-val-${m.id}`,
            materialId: m.id,
            patrimonio: m.patrimonio,
            tipoMaterial: m.tipo,
            estacao: m.estacao,
            sgb: m.sgb,
            tipoAlerta: 'VENCIDO',
            severidade: 'URGENTE',
            mensagem: `Vencido há ${Math.abs(diffDays)} dias (${m.dataValidade}).`,
            dataReferencia: m.dataValidade,
            diasRestantes: diffDays,
          });
        }
      }
    });
    return alerts;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await fetch('/api/dashboard/stats', { headers: getAuthHeaders() });
      if (res.ok) return res.json();
    } catch (e) {}

    const materials = getStoredMaterials();
    const total = materials.length;
    const operando = materials.filter((m) => m.status === 'OPERANDO').length;
    const baixado = materials.filter((m) => m.status === 'BAIXADO').length;
    const emManutencao = materials.filter((m) => m.status === 'EM MANUTENÇÃO').length;
    const reserva = materials.filter((m) => m.status === 'RESERVA').length;
    const porCategoria: Record<string, { total: number; operando: number; baixado: number; emManutencao: number }> = {};
    materials.forEach((m) => {
      const cat = m.categoria || 'EQUIPAMENTOS DIVERSOS';
      if (!porCategoria[cat]) {
        porCategoria[cat] = { total: 0, operando: 0, baixado: 0, emManutencao: 0 };
      }
      porCategoria[cat].total += 1;
      if (m.status === 'OPERANDO') porCategoria[cat].operando += 1;
      if (m.status === 'BAIXADO') porCategoria[cat].baixado += 1;
      if (m.status === 'EM MANUTENÇÃO') porCategoria[cat].emManutencao += 1;
    });

    const porEstacao: Record<string, { total: number; operando: number; baixado: number }> = {};
    materials.forEach((m) => {
      const est = m.estacao || 'Desconhecida';
      if (!porEstacao[est]) {
        porEstacao[est] = { total: 0, operando: 0, baixado: 0 };
      }
      porEstacao[est].total += 1;
      if (m.status === 'OPERANDO') porEstacao[est].operando += 1;
      if (m.status === 'BAIXADO') porEstacao[est].baixado += 1;
    });

    const indiceProntidao = total > 0 ? Math.round((operando / total) * 100) : 100;

    return {
      totalEquipamentos: total,
      operando,
      baixado,
      emManutencao,
      reserva,
      indiceProntidao,
      alertasCriticos: 0,
      vencidos: 0,
      vencendo30Dias: 0,
      manutencaoPendente: 0,
      porCategoria,
      porEstacao,
    };
  },

  async importCsv(csvText: string, defaultEstacaoId: string): Promise<{ success: boolean; count: number }> {
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ csvText, defaultEstacaoId }),
      });
      if (res.ok) return res.json();
    } catch (e) {}
    return { success: true, count: 0 };
  },

  async resetData(): Promise<void> {
    try {
      await fetch('/api/reset-data', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {}
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(STATIONS_STORAGE_KEY);
    localStorage.removeItem(MATERIALS_STORAGE_KEY);
  },
};
