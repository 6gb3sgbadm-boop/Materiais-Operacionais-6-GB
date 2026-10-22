/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { MaterialList } from './components/MaterialList';
import { OperationalMap } from './components/OperationalMap';
import { StationsView } from './components/StationsView';
import { AlertsPanel } from './components/AlertsPanel';
import { MaterialModal } from './components/MaterialModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { UserManagementModal } from './components/UserManagementModal';
import { DailyChecklistModal } from './components/DailyChecklistModal';
import { ImportExportModal } from './components/ImportExportModal';
import { LoginScreen } from './components/LoginScreen';
import { MaterialOperacional, FireStation, Usuario, AlertaItem, DashboardStats } from './types';
import { INITIAL_MATERIALS, INITIAL_STATIONS, INITIAL_USERS, OFFICIAL_CATEGORIES } from './data/initialData';

function MainApp() {
  const { currentUser, isAuthenticated, setAvailableUsers } = useAuth();

  // If user is not authenticated, show military login screen
  if (!isAuthenticated || !currentUser) {
    return <LoginScreen />;
  }

  const [currentTab, setCurrentTab] = useState<'materials' | 'map' | 'alerts' | 'stations'>('materials');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [materials, setMaterials] = useState<MaterialOperacional[]>(INITIAL_MATERIALS);
  const [stations, setStations] = useState<FireStation[]>(INITIAL_STATIONS);
  const [alerts, setAlerts] = useState<AlertaItem[]>([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialOperacional | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [materialForMaintenance, setMaterialForMaintenance] = useState<MaterialOperacional | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [mapFocusedStationId, setMapFocusedStationId] = useState<string | null>(null);

  // Load all data from backend/storage
  const loadData = useCallback(async () => {
    try {
      const [fetchedStations, fetchedMaterials, fetchedAlerts, fetchedUsers] = await Promise.all([
        api.getStations().catch(() => INITIAL_STATIONS),
        api.getMaterials().catch(() => INITIAL_MATERIALS),
        api.getAlerts().catch(() => []),
        api.getUsers().catch(() => INITIAL_USERS),
      ]);

      setStations(fetchedStations);
      setMaterials(fetchedMaterials);
      setAlerts(fetchedAlerts);
      setAvailableUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching data from API:', err);
    } finally {
      setLoading(false);
    }
  }, [setAvailableUsers]);

  // Default station filter to station of Operador do Posto
  useEffect(() => {
    if (currentUser.nivelAcesso === 'OPERADOR_POSTO' && currentUser.estacaoAutorizadaId) {
      setSelectedStationFilter(currentUser.estacaoAutorizadaId);
    } else {
      setSelectedStationFilter('ALL');
    }
    loadData();
  }, [currentUser, loadData]);

  // STRICT RBAC SCOPING:
  // 1. Operador do Posto: vê e interage estritamente com os materiais do seu posto cadastrado por Gmail
  // 2. Gestor de SGB: vê todos os postos do SGB que lhe é pertinente
  // 3. Visualizador do GB e SuperAdmin: vê todas as estações do 6° GB
  const scopedMaterials = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.nivelAcesso === 'OPERADOR_POSTO' && currentUser.estacaoAutorizadaId) {
      return materials.filter(
        (m) =>
          m.estacaoId === currentUser.estacaoAutorizadaId ||
          m.estacao === currentUser.estacaoAutorizadaId
      );
    }
    if (currentUser.nivelAcesso === 'GESTOR_SGB' && currentUser.sgbAutorizado) {
      return materials.filter((m) => m.sgb === currentUser.sgbAutorizado);
    }
    return materials;
  }, [materials, currentUser]);

  const scopedStations = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.nivelAcesso === 'OPERADOR_POSTO' && currentUser.estacaoAutorizadaId) {
      return stations.filter((s) => s.id === currentUser.estacaoAutorizadaId);
    }
    if (currentUser.nivelAcesso === 'GESTOR_SGB' && currentUser.sgbAutorizado) {
      return stations.filter((s) => s.sgb === currentUser.sgbAutorizado);
    }
    return stations;
  }, [stations, currentUser]);

  // LIVE ACCURATE STATS: Calculated directly from the scoped materials with 100% precision!
  const liveStats = useMemo<DashboardStats>(() => {
    const total = scopedMaterials.length;
    const operando = scopedMaterials.filter((m) => m.status === 'OPERANDO').length;
    const baixado = scopedMaterials.filter((m) => m.status === 'BAIXADO').length;
    const emManutencao = scopedMaterials.filter((m) => m.status === 'EM MANUTENÇÃO').length;
    const reserva = scopedMaterials.filter((m) => m.status === 'RESERVA').length;
    const indiceProntidao = total > 0 ? Math.round((operando / total) * 100) : 100;

    const porCategoria: Record<string, { total: number; operando: number; baixado: number; emManutencao: number }> = {};
    OFFICIAL_CATEGORIES.forEach((cat) => {
      porCategoria[cat] = { total: 0, operando: 0, baixado: 0, emManutencao: 0 };
    });

    scopedMaterials.forEach((m) => {
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
    scopedMaterials.forEach((m) => {
      const est = m.estacao || 'Desconhecida';
      if (!porEstacao[est]) {
        porEstacao[est] = { total: 0, operando: 0, baixado: 0 };
      }
      porEstacao[est].total += 1;
      if (m.status === 'OPERANDO') porEstacao[est].operando += 1;
      if (m.status === 'BAIXADO') porEstacao[est].baixado += 1;
    });

    const vencidos = alerts.filter((a) => a.tipoAlerta === 'VENCIDO').length;
    const vencendo30Dias = alerts.filter((a) => a.tipoAlerta === 'VENCENDO_30_DIAS').length;
    const manutencaoPendente = alerts.filter((a) => a.tipoAlerta === 'MANUTENCAO_VENCIDA').length;

    return {
      totalEquipamentos: total,
      operando,
      baixado,
      emManutencao,
      reserva,
      indiceProntidao,
      alertasCriticos: vencidos + manutencaoPendente,
      vencidos,
      vencendo30Dias,
      manutencaoPendente,
      porCategoria,
      porEstacao,
    };
  }, [scopedMaterials, alerts]);

  // Handlers for Materials
  const handleSaveMaterial = async (data: Partial<MaterialOperacional>) => {
    if (materialToEdit) {
      await api.updateMaterial(materialToEdit.id, data);
    } else {
      await api.createMaterial(data);
    }
    await loadData();
  };

  const handleDeleteMaterial = async (mat: MaterialOperacional) => {
    if (confirm(`Confirma exclusão do material patrimônio ${mat.patrimonio} (${mat.tipo})?`)) {
      await api.deleteMaterial(mat.id);
      await loadData();
    }
  };

  const handleRegisterMaintenance = async (payload: {
    tipo: string;
    descricao: string;
    responsavel: string;
    novoStatus?: any;
    novoEstadoConservacao?: any;
    proximaData?: string;
  }) => {
    if (!materialForMaintenance) return;
    await api.registerMaintenance(materialForMaintenance.id, payload);
    await loadData();
  };

  // Handlers for Users (Restricted to SuperAdmin)
  const handleAddUser = async (user: Partial<Usuario>) => {
    await api.addUser(user);
    await loadData();
  };

  const handleUpdateUser = async (id: string, user: Partial<Usuario>) => {
    await api.updateUser(id, user);
    await loadData();
  };

  const handleDeleteUser = async (id: string) => {
    await api.deleteUser(id);
    await loadData();
  };

  // Handlers for Stations with immediate state propagation
  const handleUpdateStation = async (id: string, data: Partial<FireStation>) => {
    const updated = await api.updateStation(id, data);
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    await loadData();
  };

  const handleAddStation = async (data: Partial<FireStation>) => {
    const created = await api.addStation(data);
    setStations((prev) => [...prev, created]);
    await loadData();
  };

  // Handlers for Import & Export
  const handleImportCsv = async (csvText: string, stationId: string) => {
    const res = await api.importCsv(csvText, stationId);
    await loadData();
    return res;
  };

  const handleExportCsv = () => {
    const query = selectedStationFilter !== 'ALL' ? `?estacaoId=${selectedStationFilter}` : '';
    window.location.href = `/api/export/csv${query}`;
  };

  const handleResetData = async () => {
    if (confirm('Deseja restaurar o banco para os dados originais padrão da planilha (EB São Vicente / 3° SGB)?')) {
      await api.resetData();
      await loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navbar with live user info, radio player, and logout */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        alerts={alerts}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenChecklistModal={() => setIsChecklistModalOpen(true)}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* KPI & Quick Category Header Overview (Accurate live counts for Compressor, EPR, etc.) */}
        <DashboardOverview
          stats={liveStats}
          materials={scopedMaterials}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            if (currentTab !== 'materials') setCurrentTab('materials');
          }}
          selectedStatus={selectedStatus}
          onSelectStatus={(st) => {
            setSelectedStatus(st);
            if (currentTab !== 'materials') setCurrentTab('materials');
          }}
          onGoToAlerts={() => setCurrentTab('alerts')}
        />

        {/* Tab View: Materials Table (Scoped to authorized post/SGB) */}
        {currentTab === 'materials' && (
          <MaterialList
            materials={scopedMaterials}
            stations={scopedStations}
            selectedCategory={selectedCategory}
            selectedStationFilter={selectedStationFilter}
            onChangeStationFilter={setSelectedStationFilter}
            selectedStatus={selectedStatus}
            onChangeStatusFilter={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCreateModal={() => {
              setMaterialToEdit(null);
              setIsMaterialModalOpen(true);
            }}
            onOpenEditModal={(mat) => {
              setMaterialToEdit(mat);
              setIsMaterialModalOpen(true);
            }}
            onOpenMaintenanceModal={(mat) => {
              setMaterialForMaintenance(mat);
              setIsMaintenanceModalOpen(true);
            }}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {/* Tab View: Operational Tactical Map (Fire Engine Trucks) */}
        {currentTab === 'map' && (
          <OperationalMap
            stations={scopedStations}
            materials={scopedMaterials}
            focusedStationId={mapFocusedStationId}
            onSelectStationFilter={(stId) => {
              setSelectedStationFilter(stId);
              setCurrentTab('materials');
            }}
          />
        )}

        {/* Tab View: Alerts & Expirations */}
        {currentTab === 'alerts' && (
          <AlertsPanel
            alerts={alerts}
            materials={scopedMaterials}
            onOpenMaintenanceModal={(mat) => {
              setMaterialForMaintenance(mat);
              setIsMaintenanceModalOpen(true);
            }}
            onFilterByMaterial={(patr) => {
              setSearchQuery(patr);
              setCurrentTab('materials');
            }}
          />
        )}

        {/* Tab View: Stations Management (Auto-derived commanders) */}
        {currentTab === 'stations' && (
          <StationsView
            stations={scopedStations}
            materials={scopedMaterials}
            onUpdateStation={handleUpdateStation}
            onAddStation={handleAddStation}
            onViewStationOnMap={(stId) => {
              setMapFocusedStationId(stId);
              setCurrentTab('map');
            }}
            onFilterStationMaterials={(stId) => {
              setSelectedStationFilter(stId);
              setCurrentTab('materials');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <p>
          SIGMA-CB • Sistema Integrado de Gestão de Materiais Operacionais • Corpo de Bombeiros da PMESP (6° GB)
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Acesso Militar Restrito por Gmail • Autenticação Homologada PMESP
        </p>
      </footer>

      {/* Modals */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setMaterialToEdit(null);
        }}
        onSave={handleSaveMaterial}
        materialToEdit={materialToEdit}
        stations={scopedStations}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsMaintenanceModalOpen(false);
          setMaterialForMaintenance(null);
        }}
        material={materialForMaintenance}
        onConfirm={handleRegisterMaintenance}
      />

      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        stations={stations}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      <DailyChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        stations={scopedStations}
        materials={scopedMaterials}
      />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        stations={stations}
        onImport={handleImportCsv}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
