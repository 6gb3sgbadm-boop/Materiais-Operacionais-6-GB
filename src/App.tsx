/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { MaterialList } from './components/MaterialList';
import { OperationalMap } from './components/OperationalMap';
import { AlertsPanel } from './components/AlertsPanel';
import { StationsView } from './components/StationsView';
import { MaterialModal } from './components/MaterialModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { UserManagementModal } from './components/UserManagementModal';
import { DailyChecklistModal } from './components/DailyChecklistModal';
import { ImportExportModal } from './components/ImportExportModal';
import { api } from './services/api';
import { MaterialOperacional, FireStation, Usuario, AlertaItem, DashboardStats } from './types';
import { INITIAL_MATERIALS, INITIAL_STATIONS, INITIAL_USERS } from './data/initialData';

function MainApp() {
  const { currentUser, setAvailableUsers } = useAuth();
  const [currentTab, setCurrentTab] = useState<'materials' | 'map' | 'alerts' | 'stations'>('materials');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [materials, setMaterials] = useState<MaterialOperacional[]>(INITIAL_MATERIALS);
  const [stations, setStations] = useState<FireStation[]>(INITIAL_STATIONS);
  const [alerts, setAlerts] = useState<AlertaItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipamentos: 0,
    operando: 0,
    baixado: 0,
    emManutencao: 0,
    reserva: 0,
    indiceProntidao: 100,
    alertasCriticos: 0,
    vencidos: 0,
    vencendo30Dias: 0,
    manutencaoPendente: 0,
    porCategoria: {},
    porEstacao: {},
  });

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

  // Load all data from backend
  const loadData = useCallback(async () => {
    try {
      const [fetchedStations, fetchedMaterials, fetchedAlerts, fetchedStats, fetchedUsers] = await Promise.all([
        api.getStations().catch(() => INITIAL_STATIONS),
        api.getMaterials().catch(() => INITIAL_MATERIALS),
        api.getAlerts().catch(() => []),
        api.getDashboardStats().catch(() => null),
        api.getUsers().catch(() => INITIAL_USERS),
      ]);

      setStations(fetchedStations);
      setMaterials(fetchedMaterials);
      setAlerts(fetchedAlerts);
      setAvailableUsers(fetchedUsers);

      if (fetchedStats) {
        setStats(fetchedStats);
      }
    } catch (err) {
      console.error('Error fetching data from API:', err);
    } finally {
      setLoading(false);
    }
  }, [setAvailableUsers]);

  // If active user is an OPERADOR_POSTO, default station filter to their station, else reset to ALL
  useEffect(() => {
    if (currentUser.nivelAcesso === 'OPERADOR_POSTO' && currentUser.estacaoAutorizadaId) {
      setSelectedStationFilter(currentUser.estacaoAutorizadaId);
    } else {
      setSelectedStationFilter('ALL');
    }
    loadData();
  }, [currentUser, loadData]);

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

  // Handlers for Users
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

  // Handlers for Stations
  const handleUpdateStation = async (id: string, data: Partial<FireStation>) => {
    await api.updateStation(id, data);
    await loadData();
  };

  const handleAddStation = async (data: Partial<FireStation>) => {
    await api.addStation(data);
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
      {/* Top Navbar */}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI & Quick Category Header Overview */}
        <DashboardOverview
          stats={stats}
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

        {/* Tab View: Materials Table (Spreadsheet Data Grid) */}
        {currentTab === 'materials' && (
          <MaterialList
            materials={materials}
            stations={stations}
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

        {/* Tab View: Operational Map (6° GB / 3° SGB) */}
        {currentTab === 'map' && (
          <OperationalMap
            stations={stations}
            materials={materials}
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
            materials={materials}
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

        {/* Tab View: Stations Management */}
        {currentTab === 'stations' && (
          <StationsView
            stations={stations}
            materials={materials}
            onUpdateStation={handleUpdateStation}
            onAddStation={handleAddStation}
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
          SIGMA-CB • Sistema Integrado de Gestão de Materiais Operacionais • Corpo de Bombeiros da PMESP (6° GB / 3° SGB - EB São Vicente)
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          Open-Source • Conteinerizado via Docker • CI/CD GitHub Actions • Armazenamento Persistente
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
        stations={stations}
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
        stations={stations}
        materials={materials}
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
