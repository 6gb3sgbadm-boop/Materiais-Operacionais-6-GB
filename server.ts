/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { INITIAL_MATERIALS, INITIAL_STATIONS, INITIAL_USERS, CATEGORIAS_COM_VALIDADE } from './src/data/initialData';
import { MaterialOperacional, FireStation, Usuario, AlertaItem, DashboardStats, SgbId } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_PATH = path.join(__dirname, 'data', 'database.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

interface DatabaseSchema {
  stations: FireStation[];
  users: Usuario[];
  materials: MaterialOperacional[];
  lastUpdated: string;
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.materials && parsed.stations && parsed.users) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading database file, reinitializing...', err);
  }

  // Initialize with seed data
  const initialDb: DatabaseSchema = {
    stations: INITIAL_STATIONS,
    users: INITIAL_USERS,
    materials: INITIAL_MATERIALS,
    lastUpdated: new Date().toISOString(),
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

// In-memory reference synced with disk
let db = loadDatabase();

// Helper to compute alerts based on current date
function calculateAlerts(materials: MaterialOperacional[]): AlertaItem[] {
  const alerts: AlertaItem[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  materials.forEach((mat) => {
    // Alerta de Validade / Teste Hidrostático (apenas para categorias pertinentes: CILINDROS, EPR, ALTURA, PRODUTOS PERIGOSOS)
    if (mat.dataValidade && CATEGORIAS_COM_VALIDADE.includes(mat.categoria)) {
      const valDate = new Date(mat.dataValidade + 'T00:00:00');
      const diffTime = valDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isCilindro = mat.categoria === 'CILINDROS';

      if (diffDays < 0) {
        alerts.push({
          id: `alert-val-${mat.id}`,
          materialId: mat.id,
          patrimonio: mat.patrimonio,
          tipoMaterial: mat.tipo,
          estacao: mat.estacao,
          sgb: mat.sgb,
          tipoAlerta: 'VENCIDO',
          severidade: 'URGENTE',
          mensagem: isCilindro
            ? `Teste hidrostático do cilindro expirado em ${mat.dataValidade}! (${Math.abs(diffDays)} dias em atraso)`
            : `Validade normativa expirada em ${mat.dataValidade}! (${Math.abs(diffDays)} dias em atraso)`,
          dataReferencia: mat.dataValidade,
          diasRestantes: diffDays,
        });
      } else if (diffDays <= 30) {
        alerts.push({
          id: `alert-val-${mat.id}`,
          materialId: mat.id,
          patrimonio: mat.patrimonio,
          tipoMaterial: mat.tipo,
          estacao: mat.estacao,
          sgb: mat.sgb,
          tipoAlerta: 'VENCENDO_30_DIAS',
          severidade: 'ALERTA',
          mensagem: isCilindro
            ? `Teste hidrostático do cilindro vence em ${diffDays} dias (${mat.dataValidade}). Requer agendamento de reteste.`
            : `Validade vencendo em ${diffDays} dias (${mat.dataValidade}). Requer providências.`,
          dataReferencia: mat.dataValidade,
          diasRestantes: diffDays,
        });
      }
    }

    // Alerta de Manutenção Preventiva
    if (mat.proximaManutencao) {
      const manDate = new Date(mat.proximaManutencao + 'T00:00:00');
      const diffTime = manDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alerts.push({
          id: `alert-man-${mat.id}`,
          materialId: mat.id,
          patrimonio: mat.patrimonio,
          tipoMaterial: mat.tipo,
          estacao: mat.estacao,
          sgb: mat.sgb,
          tipoAlerta: 'MANUTENCAO_VENCIDA',
          severidade: 'URGENTE',
          mensagem: `Manutenção preventiva atrasada desde ${mat.proximaManutencao} (${Math.abs(diffDays)} dias).`,
          dataReferencia: mat.proximaManutencao,
          diasRestantes: diffDays,
        });
      } else if (diffDays <= 30) {
        alerts.push({
          id: `alert-man-${mat.id}`,
          materialId: mat.id,
          patrimonio: mat.patrimonio,
          tipoMaterial: mat.tipo,
          estacao: mat.estacao,
          sgb: mat.sgb,
          tipoAlerta: 'MANUTENCAO_30_DIAS',
          severidade: 'ALERTA',
          mensagem: `Manutenção preventiva prevista para ${diffDays} dias (${mat.proximaManutencao}).`,
          dataReferencia: mat.proximaManutencao,
          diasRestantes: diffDays,
        });
      }
    }

    // Alerta de Equipamento Baixado
    if (mat.status === 'BAIXADO') {
      alerts.push({
        id: `alert-bx-${mat.id}`,
        materialId: mat.id,
        patrimonio: mat.patrimonio,
        tipoMaterial: mat.tipo,
        estacao: mat.estacao,
        sgb: mat.sgb,
        tipoAlerta: 'BAIXADO',
        severidade: 'INFO',
        mensagem: `Equipamento baixado da carga operacional. Motivo: ${mat.observacao.slice(0, 60)}...`,
        dataReferencia: mat.atualizadoEm ? mat.atualizadoEm.split('T')[0] : todayStr,
      });
    }
  });

  return alerts;
}

// Compute dashboard stats
function calculateDashboardStats(materials: MaterialOperacional[]): DashboardStats {
  const alerts = calculateAlerts(materials);
  const total = materials.length;
  const operando = materials.filter((m) => m.status === 'OPERANDO').length;
  const baixado = materials.filter((m) => m.status === 'BAIXADO').length;
  const emManutencao = materials.filter((m) => m.status === 'EM MANUTENÇÃO').length;
  const reserva = materials.filter((m) => m.status === 'RESERVA').length;

  const indiceProntidao = total > 0 ? Math.round((operando / total) * 100) : 100;

  const vencidos = alerts.filter((a) => a.tipoAlerta === 'VENCIDO').length;
  const vencendo30Dias = alerts.filter((a) => a.tipoAlerta === 'VENCENDO_30_DIAS').length;
  const manutencaoPendente = alerts.filter((a) => a.tipoAlerta === 'MANUTENCAO_VENCIDA').length;
  const alertasCriticos = alerts.filter((a) => a.severidade === 'URGENTE').length;

  const porCategoria: Record<string, { total: number; operando: number; baixado: number; emManutencao: number }> = {};
  materials.forEach((m) => {
    const cat = m.categoria || 'DIVERSOS';
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

  return {
    totalEquipamentos: total,
    operando,
    baixado,
    emManutencao,
    reserva,
    indiceProntidao,
    alertasCriticos,
    vencidos,
    vencendo30Dias,
    manutencaoPendente,
    porCategoria,
    porEstacao,
  };
}

// Helper to get authenticated user from request header
function getUserFromRequest(req: Request): Usuario {
  const email = (req.headers['x-user-email'] as string) || '';
  if (email) {
    const found = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found && found.ativo) return found;
  }
  // Default to primary SuperAdmin (6gb3sgbadm@gmail.com)
  return db.users[0];
}

// ======================== API ROUTES ========================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'SIGMA-CB',
    timestamp: new Date().toISOString(),
    stationsCount: db.stations.length,
    materialsCount: db.materials.length,
    usersCount: db.users.length,
  });
});

// Stations list (retorna todos os 19 postos operacionais do 6° GB para o diretório, mapa e seletores)
app.get('/api/stations', (req: Request, res: Response) => {
  res.json(db.stations);
});

app.post('/api/stations', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user.nivelAcesso !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso negado: apenas o Gestor de Tudo pode cadastrar postos' });
  }

  const newStation: FireStation = {
    ...req.body,
    id: req.body.id || `eb-${Date.now()}`,
    ativa: req.body.ativa !== undefined ? req.body.ativa : true,
  };
  db.stations.push(newStation);
  saveDatabase(db);
  res.status(201).json(newStation);
});

app.put('/api/stations/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user.nivelAcesso !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso negado: apenas o Gestor de Tudo pode editar postos' });
  }

  const { id } = req.params;
  const idx = db.stations.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Posto não encontrado' });
  db.stations[idx] = { ...db.stations[idx], ...req.body };
  saveDatabase(db);
  res.json(db.stations[idx]);
});

// Users management (Exclusivo SuperAdmin: 6gb3sgbadm@gmail.com)
app.get('/api/users', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user.nivelAcesso !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso negado: apenas o Gestor de Tudo pode gerenciar usuários e acessos' });
  }
  res.json(db.users);
});

app.post('/api/users', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user.nivelAcesso !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso negado: apenas o Gestor de Tudo pode autorizar novos usuários' });
  }

  const { email, nome, postoGraduacao, nivelAcesso, estacaoAutorizadaId, sgbAutorizado } = req.body;
  if (!email || !nome || !nivelAcesso) {
    return res.status(400).json({ error: 'Email, nome e nível de acesso são obrigatórios' });
  }

  // Check if email already registered
  const exists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema' });
  }

  const newUser: Usuario = {
    id: `usr-${Date.now()}`,
    email: email.trim().toLowerCase(),
    nome: nome.trim(),
    postoGraduacao: postoGraduacao || 'Bombeiro PM',
    nivelAcesso,
    estacaoAutorizadaId,
    sgbAutorizado,
    ativo: true,
    dataCadastro: new Date().toISOString().split('T')[0],
  };

  db.users.push(newUser);
  saveDatabase(db);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user.nivelAcesso !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso negado: apenas o Gestor de Tudo pode alterar permissões' });
  }

  const { id } = req.params;
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

  db.users[idx] = { ...db.users[idx], ...req.body };
  saveDatabase(db);
  res.json(db.users[idx]);
});

app.delete('/api/users/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  if (user.nivelAcesso !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso negado: apenas o Gestor de Tudo pode excluir usuários' });
  }

  const { id } = req.params;
  const targetUser = db.users.find((u) => u.id === id);
  if (targetUser?.email === '6gb3sgbadm@gmail.com') {
    return res.status(403).json({ error: 'Não é permitido revogar o Administrador Geral Master' });
  }
  db.users = db.users.filter((u) => u.id !== id);
  saveDatabase(db);
  res.json({ success: true, message: 'Usuário removido com sucesso' });
});

// Materials list with query filters and RBAC enforcement
app.get('/api/materials', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  let list = [...db.materials];
  const { estacaoId, sgb, categoria, status, search, conservation } = req.query;

  // Enforce access boundary:
  // 1. Operador do Posto: vê estritamente o seu posto determinado por Gmail
  if (user.nivelAcesso === 'OPERADOR_POSTO' && user.estacaoAutorizadaId) {
    list = list.filter((m) => m.estacaoId === user.estacaoAutorizadaId);
  } else if (user.nivelAcesso === 'GESTOR_SGB' && user.sgbAutorizado) {
    // 2. Gestor de SGB: vê todos os postos do SGB que lhe é pertinente
    list = list.filter((m) => m.sgb === user.sgbAutorizado);
    if (estacaoId && estacaoId !== 'ALL') {
      list = list.filter((m) => m.estacaoId === estacaoId || m.estacao === estacaoId);
    }
  } else {
    // 3. Visualizador do GB Todo e SuperAdmin: podem filtrar por qualquer posto
    if (estacaoId && estacaoId !== 'ALL') {
      list = list.filter((m) => m.estacaoId === estacaoId || m.estacao === estacaoId);
    }
    if (sgb && sgb !== 'ALL') {
      list = list.filter((m) => m.sgb === sgb);
    }
  }

  if (categoria && categoria !== 'ALL') {
    list = list.filter((m) => m.categoria === categoria);
  }
  if (status && status !== 'ALL') {
    list = list.filter((m) => m.status === status);
  }
  if (conservation && conservation !== 'ALL') {
    list = list.filter((m) => m.estadoConservacao === conservation);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (m) =>
        m.patrimonio.toLowerCase().includes(q) ||
        m.tipo.toLowerCase().includes(q) ||
        m.marca.toLowerCase().includes(q) ||
        m.modelo.toLowerCase().includes(q) ||
        m.observacao.toLowerCase().includes(q) ||
        m.estacao.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

// Create material
app.post('/api/materials', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const data = req.body;

  // Visualizador do GB e Gestor SGB não têm permissão de inclusão
  if (user.nivelAcesso === 'VISUALIZADOR_GB' || user.nivelAcesso === 'GESTOR_SGB') {
    return res.status(403).json({
      error: 'Seu nível de acesso é de visualização/relatórios. Inclusão de material não autorizada.',
    });
  }

  if (!data.tipo || !data.patrimonio) {
    return res.status(400).json({ error: 'Tipo e Patrimônio são obrigatórios' });
  }

  // Operador do posto: forçar o posto autorizado ao seu Gmail
  let targetStationId = data.estacaoId;
  if (user.nivelAcesso === 'OPERADOR_POSTO') {
    targetStationId = user.estacaoAutorizadaId || 'eb-sao-vicente';
  }

  const station = db.stations.find((s) => s.id === targetStationId || s.nome === data.estacao);
  const estacaoNome = station ? station.nome : data.estacao || 'EB São Vicente';
  const estacaoId = station ? station.id : targetStationId || 'eb-sao-vicente';
  const sgb = station ? station.sgb : data.sgb || '3° SGB';

  const newMaterial: MaterialOperacional = {
    ...data,
    id: `mat-${Date.now()}`,
    estacao: estacaoNome,
    estacaoId,
    sgb,
    quantidade: Number(data.quantidade) || 1,
    status: data.status || 'OPERANDO',
    estadoConservacao: data.estadoConservacao || 'BOM',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    historico: [
      {
        id: `h-${Date.now()}`,
        data: new Date().toISOString().split('T')[0],
        tipo: 'CADASTRO',
        usuario: user.nome || data.responsavelConferencia || 'Operador',
        descricao: `Cadastro inicial do material pelo operador (${user.email}).`,
      },
    ],
  };

  db.materials.unshift(newMaterial);
  saveDatabase(db);
  res.status(201).json(newMaterial);
});

// Update material
app.put('/api/materials/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const { id } = req.params;
  const idx = db.materials.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Material não encontrado' });

  const existing = db.materials[idx];

  // Restrição de edição
  if (user.nivelAcesso === 'VISUALIZADOR_GB' || user.nivelAcesso === 'GESTOR_SGB') {
    return res.status(403).json({
      error: 'Seu nível de acesso é apenas de visualização. Edição não autorizada.',
    });
  }

  if (user.nivelAcesso === 'OPERADOR_POSTO' && existing.estacaoId !== user.estacaoAutorizadaId) {
    return res.status(403).json({
      error: `Acesso negado: seu usuário só pode editar materiais da sua estação autorizada (${user.estacaoAutorizadaId}).`,
    });
  }

  const updated: MaterialOperacional = {
    ...existing,
    ...req.body,
    estacaoId: user.nivelAcesso === 'OPERADOR_POSTO' ? existing.estacaoId : req.body.estacaoId || existing.estacaoId,
    atualizadoEm: new Date().toISOString(),
  };

  db.materials[idx] = updated;
  saveDatabase(db);
  res.json(updated);
});

// Delete material
app.delete('/api/materials/:id', (req: Request, res: Response) => {
  const user = getUserFromRequest(req);
  const { id } = req.params;
  const idx = db.materials.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Material não encontrado' });

  const existing = db.materials[idx];

  if (user.nivelAcesso === 'VISUALIZADOR_GB' || user.nivelAcesso === 'GESTOR_SGB') {
    return res.status(403).json({
      error: 'Seu nível de acesso é apenas de visualização. Exclusão não autorizada.',
    });
  }

  if (user.nivelAcesso === 'OPERADOR_POSTO' && existing.estacaoId !== user.estacaoAutorizadaId) {
    return res.status(403).json({
      error: 'Acesso negado: você só tem permissão para excluir materiais do seu posto.',
    });
  }

  db.materials.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true, message: 'Material excluído com sucesso' });
});

// Register maintenance or inspection event
app.post('/api/materials/:id/maintenance', (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipo, descricao, responsavel, novoStatus, novoEstadoConservacao, proximaData } = req.body;

  const idx = db.materials.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Material não encontrado' });

  const item = db.materials[idx];
  const nowStr = new Date().toISOString().split('T')[0];

  const hist = item.historico || [];
  hist.unshift({
    id: `h-${Date.now()}`,
    data: nowStr,
    tipo: tipo || 'MANUTENÇÃO',
    usuario: responsavel || 'Operador',
    descricao: descricao || 'Manutenção/Inspeção preventiva registrada.',
    estadoAnterior: item.status,
    estadoNovo: novoStatus || item.status,
  });

  if (novoStatus) item.status = novoStatus;
  if (novoEstadoConservacao) item.estadoConservacao = novoEstadoConservacao;
  item.ultimaManutencao = nowStr;
  if (proximaData) item.proximaManutencao = proximaData;
  item.historico = hist;
  item.atualizadoEm = new Date().toISOString();

  saveDatabase(db);
  res.json(item);
});

// Alerts
app.get('/api/alerts', (req: Request, res: Response) => {
  const alerts = calculateAlerts(db.materials);
  res.json(alerts);
});

// Dashboard stats
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const stats = calculateDashboardStats(db.materials);
  res.json(stats);
});

// Export CSV in the original spreadsheet format + extra columns
app.get('/api/export/csv', (req: Request, res: Response) => {
  const { estacaoId } = req.query;
  let items = db.materials;
  if (estacaoId && estacaoId !== 'ALL') {
    items = items.filter((m) => m.estacaoId === estacaoId || m.estacao === estacaoId);
  }

  const operandoCount = items.filter((m) => m.status === 'OPERANDO').length;
  const baixadoCount = items.filter((m) => m.status === 'BAIXADO').length;

  let csv = `EQUIPAMENTOS OPERANDO,,,${operandoCount},,,,\n`;
  csv += `EQUIPAMENTOS BAIXADO,,,${baixadoCount},,,,\n\n`;
  csv += `PATRIMÔNIO,TIPO,MARCA,MODELO,STATUS,SGB,ESTAÇÃO,OBSERVAÇÃO,CATEGORIA,ESTADO,VALIDADE,PROX_MANUTENCAO\n`;

  items.forEach((m) => {
    const row = [
      `"${(m.patrimonio || '').replace(/"/g, '""')}"`,
      `"${(m.tipo || '').replace(/"/g, '""')}"`,
      `"${(m.marca || '').replace(/"/g, '""')}"`,
      `"${(m.modelo || '').replace(/"/g, '""')}"`,
      `"${m.status || 'OPERANDO'}"`,
      `"${m.sgb || '3° SGB'}"`,
      `"${m.estacao || 'SÃO VICENTE'}"`,
      `"${(m.observacao || '').replace(/"/g, '""')}"`,
      `"${m.categoria || 'COMPRESSOR'}"`,
      `"${m.estadoConservacao || 'BOM'}"`,
      `"${m.dataValidade || ''}"`,
      `"${m.proximaManutencao || ''}"`,
    ];
    csv += row.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="materiais_operacionais_cb.csv"');
  res.send('\uFEFF' + csv); // Include BOM for Excel in Windows
});

// Batch import CSV
app.post('/api/import/csv', (req: Request, res: Response) => {
  const { csvText, defaultEstacaoId } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: 'Conteúdo CSV é obrigatório' });
  }

  const lines = csvText.split(/\r?\n/);
  let importedCount = 0;
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('PATRIMÔNIO') && line.includes('TIPO')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return res.status(400).json({ error: 'Cabeçalho da planilha (PATRIMÔNIO, TIPO...) não encontrado' });
  }

  const dataRows = lines.slice(headerIndex + 1);
  const targetStation = db.stations.find((s) => s.id === defaultEstacaoId) || db.stations[0];

  dataRows.forEach((row: string) => {
    if (!row.trim()) return;
    // Basic CSV row split handling quotes
    const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
    const cleanCols = cols.map((c: string) => c.replace(/^"|"$/g, '').trim());

    if (cleanCols.length >= 2 && cleanCols[0]) {
      const patrimonio = cleanCols[0] || `SEM-PATR-${Date.now()}`;
      const tipo = cleanCols[1] || 'Equipamento Diversos';
      const marca = cleanCols[2] || 'Genérica';
      const modelo = cleanCols[3] || 'Padrão';
      const statusRaw = (cleanCols[4] || 'OPERANDO').toUpperCase();
      const status = statusRaw.includes('BAIXAD')
        ? 'BAIXADO'
        : statusRaw.includes('MANUT')
        ? 'EM MANUTENÇÃO'
        : 'OPERANDO';
      const sgb = (cleanCols[5] as SgbId) || targetStation.sgb;
      const estacao = cleanCols[6] || targetStation.nome;
      const observacao = cleanCols[7] || '';
      const categoria = (cleanCols[8] as any) || 'COMPRESSORES';

      const newMat: MaterialOperacional = {
        id: `mat-imp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        patrimonio,
        tipo,
        marca,
        modelo,
        status: status as any,
        sgb,
        estacao,
        estacaoId: targetStation.id,
        observacao,
        categoria,
        estadoConservacao: 'BOM',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        historico: [
          {
            id: `h-${Date.now()}`,
            data: new Date().toISOString().split('T')[0],
            tipo: 'CADASTRO',
            usuario: 'Importação CSV Planilha',
            descricao: 'Importado da planilha operacional.',
          },
        ],
      };

      db.materials.push(newMat);
      importedCount++;
    }
  });

  saveDatabase(db);
  res.json({ success: true, count: importedCount });
});

// Reset data to initial state
app.post('/api/reset-data', (req: Request, res: Response) => {
  db = {
    stations: INITIAL_STATIONS,
    users: INITIAL_USERS,
    materials: INITIAL_MATERIALS,
    lastUpdated: new Date().toISOString(),
  };
  saveDatabase(db);
  res.json({ success: true, message: 'Dados restaurados para o padrão original de fábrica' });
});

// ======================== SERVER START & VITE ========================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist folder
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚒 Servidor SIGMA-CB rodando na porta ${PORT} [${isProd ? 'PROD' : 'DEV'}]`);
  });
}

startServer();
