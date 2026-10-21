/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, UserRole, MaterialOperacional } from '../types';
import { INITIAL_USERS } from '../data/initialData';

interface AuthContextType {
  currentUser: Usuario;
  setCurrentUser: (user: Usuario) => void;
  availableUsers: Usuario[];
  setAvailableUsers: React.Dispatch<React.SetStateAction<Usuario[]>>;
  canManageUsers: boolean;
  canEditStations: boolean;
  canViewGBMap: boolean;
  canImportData: boolean;
  isSuperAdmin: boolean;
  isRestrictedToStation: boolean;
  isRestrictedToSGB: boolean;
  isReadOnlyGB: boolean;
  canCreateMaterial: boolean;
  canEditMaterial: (material: MaterialOperacional) => boolean;
  canDeleteMaterial: (material: MaterialOperacional) => boolean;
  canRegisterMaintenance: (material: MaterialOperacional) => boolean;
  userRoleLabel: string;
  userRoleDescription: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableUsers, setAvailableUsers] = useState<Usuario[]>(INITIAL_USERS);
  // Default to the requested Master Admin user: 6gb3sgbadm@gmail.com
  const [currentUser, setCurrentUser] = useState<Usuario>(() => {
    const saved = localStorage.getItem('sigma_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USERS[0]; // 6gb3sgbadm@gmail.com (Gestor de Tudo)
  });

  useEffect(() => {
    localStorage.setItem('sigma_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const isSuperAdmin = currentUser.nivelAcesso === 'SUPERADMIN';
  const isRestrictedToStation = currentUser.nivelAcesso === 'OPERADOR_POSTO';
  const isRestrictedToSGB = currentUser.nivelAcesso === 'GESTOR_SGB';
  const isReadOnlyGB = currentUser.nivelAcesso === 'VISUALIZADOR_GB';

  // 1. Gestor de Tudo (SuperAdmin Master) pode alterar, editar, excluir e incluir acessos, postos, materiais e tudo mais
  const canManageUsers = isSuperAdmin;
  const canEditStations = isSuperAdmin;
  const canImportData = isSuperAdmin;

  // Mapa Geral disponível para SuperAdmin, Visualizador do GB e Gestor SGB
  const canViewGBMap = isSuperAdmin || isReadOnlyGB || isRestrictedToSGB;

  // Inclusão de material: apenas SuperAdmin e Operador do seu posto cadastrado
  const canCreateMaterial = isSuperAdmin || isRestrictedToStation;

  // Edição de material: SuperAdmin ou Operador estritamente do seu posto
  const canEditMaterial = (material: MaterialOperacional): boolean => {
    if (isSuperAdmin) return true;
    if (isRestrictedToStation) {
      return (
        material.estacaoId === currentUser.estacaoAutorizadaId ||
        material.estacao === currentUser.estacaoAutorizadaId
      );
    }
    // GESTOR_SGB e VISUALIZADOR_GB são apenas visualização/relatórios conforme solicitado
    return false;
  };

  // Exclusão de material: SuperAdmin ou Operador estritamente do seu posto
  const canDeleteMaterial = (material: MaterialOperacional): boolean => {
    if (isSuperAdmin) return true;
    if (isRestrictedToStation) {
      return (
        material.estacaoId === currentUser.estacaoAutorizadaId ||
        material.estacao === currentUser.estacaoAutorizadaId
      );
    }
    return false;
  };

  // Manutenção: SuperAdmin ou Operador do posto
  const canRegisterMaintenance = (material: MaterialOperacional): boolean => {
    if (isSuperAdmin) return true;
    if (isRestrictedToStation) {
      return (
        material.estacaoId === currentUser.estacaoAutorizadaId ||
        material.estacao === currentUser.estacaoAutorizadaId
      );
    }
    return false;
  };

  const roleLabels: Record<UserRole, string> = {
    OPERADOR_POSTO: 'Operador do Posto',
    GESTOR_SGB: 'Visualizador do SGB',
    VISUALIZADOR_GB: 'Visualizador do GB Todo',
    SUPERADMIN: 'Gestor de Tudo (Acesso Total)',
  };

  const roleDescriptions: Record<UserRole, string> = {
    OPERADOR_POSTO:
      'Funções relativas ao posto cadastrado: inclusão, exclusão e edição de materiais APENAS do seu posto determinado por Gmail.',
    GESTOR_SGB:
      'Visualiza todos os postos do SGB que lhe é pertinente (3° SGB), determinado por Gmail específico.',
    VISUALIZADOR_GB:
      'Visualiza o 6° GB todo, apenas visualização sem edição de materiais: relatórios, mapa de materiais e prontidão.',
    SUPERADMIN:
      'Acesso único e exclusivo do Administrador Geral (6gb3sgbadm@gmail.com): gerencia usuários, libera gmails, altera, edita e exclui tudo.',
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        setAvailableUsers,
        canManageUsers,
        canEditStations,
        canViewGBMap,
        canImportData,
        isSuperAdmin,
        isRestrictedToStation,
        isRestrictedToSGB,
        isReadOnlyGB,
        canCreateMaterial,
        canEditMaterial,
        canDeleteMaterial,
        canRegisterMaintenance,
        userRoleLabel: roleLabels[currentUser.nivelAcesso],
        userRoleDescription: roleDescriptions[currentUser.nivelAcesso],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
