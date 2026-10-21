/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FireStation, MaterialOperacional, Usuario, AlertaItem, DashboardStats } from '../types';

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
  return headers;
}

export const api = {
  async getStations(): Promise<FireStation[]> {
    const res = await fetch('/api/stations', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar postos de bombeiros');
    return res.json();
  },

  async addStation(data: Partial<FireStation>): Promise<FireStation> {
    const res = await fetch('/api/stations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao adicionar posto');
    return json;
  },

  async updateStation(id: string, data: Partial<FireStation>): Promise<FireStation> {
    const res = await fetch(`/api/stations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao atualizar posto');
    return json;
  },

  async getUsers(): Promise<Usuario[]> {
    const res = await fetch('/api/users', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar usuários');
    return res.json();
  },

  async addUser(data: Partial<Usuario>): Promise<Usuario> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao autorizar usuário');
    return json;
  },

  async updateUser(id: string, data: Partial<Usuario>): Promise<Usuario> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao atualizar usuário');
    return json;
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao excluir usuário');
  },

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

    const res = await fetch(`/api/materials?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar materiais operacionais');
    return res.json();
  },

  async createMaterial(data: Partial<MaterialOperacional>): Promise<MaterialOperacional> {
    const res = await fetch('/api/materials', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao cadastrar material');
    return json;
  },

  async updateMaterial(id: string, data: Partial<MaterialOperacional>): Promise<MaterialOperacional> {
    const res = await fetch(`/api/materials/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao atualizar material');
    return json;
  },

  async deleteMaterial(id: string): Promise<void> {
    const res = await fetch(`/api/materials/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao excluir material');
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
    const res = await fetch(`/api/materials/${id}/maintenance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha ao registrar manutenção');
    return json;
  },

  async getAlerts(): Promise<AlertaItem[]> {
    const res = await fetch('/api/alerts', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar alertas');
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar estatísticas');
    return res.json();
  },

  async importCsv(csvText: string, defaultEstacaoId: string): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/import/csv', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ csvText, defaultEstacaoId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha na importação do CSV');
    return json;
  },

  async resetData(): Promise<void> {
    const res = await fetch('/api/reset-data', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Falha ao resetar banco');
  },
};
