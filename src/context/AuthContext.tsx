/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario, UserRole, MaterialOperacional } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { api } from '../services/api';

const GUEST_USER: Usuario = {
  id: 'unauthenticated-guest',
  email: '',
  nome: 'Não autenticado',
  postoGraduacao: 'Militar',
  nivelAcesso: 'OPERADOR_POSTO',
  ativo: false,
  dataCadastro: '',
};

interface AuthContextType {
  currentUser: Usuario;
  isAuthenticated: boolean;
  login: (email: string) => { success: boolean; error?: string };
  logout: () => void;
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
  const [availableUsers, setAvailableUsers] = useState<Usuario[]>(() => {
    try {
      const saved = localStorage.getItem('sigma_users_db_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_USERS;
  });

  // Authenticated user session - defaults to NULL on fresh device/browser
  const [authenticatedUser, setAuthenticatedUser] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('sigma_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  // Sync available users from api/storage
  useEffect(() => {
    api
      .getUsers()
      .then((users) => {
        if (users && users.length > 0) {
          setAvailableUsers(users);
          if (authenticatedUser) {
            const fresh = users.find(
              (u) => u.email.toLowerCase() === authenticatedUser.email.toLowerCase()
            );
            if (fresh) {
              setAuthenticatedUser(fresh);
              localStorage.setItem('sigma_user', JSON.stringify(fresh));
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const setCurrentUser = useCallback((user: Usuario) => {
    setAuthenticatedUser(user);
    try {
      localStorage.setItem('sigma_user', JSON.stringify(user));
    } catch (e) {}
  }, []);

  // Login handler
  const login = useCallback(
    (emailInput: string): { success: boolean; error?: string } => {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'Por favor, digite seu Gmail militar.' };
      }

      const matched = availableUsers.find(
        (u) => u.email.trim().toLowerCase() === cleanEmail
      );

      if (!matched) {
        return {
          success: false,
          error: `O Gmail "${cleanEmail}" não está autorizado no SIGMA-CB. Solicite liberação ao Administrador Geral (6gb3sgbadm@gmail.com).`,
        };
      }

      if (!matched.ativo) {
        return {
          success: false,
          error: 'Este acesso militar está temporariamente bloqueado. Contate o Gestor de Tudo.',
        };
      }

      const updatedUser: Usuario = {
        ...matched,
        ultimoAcesso: new Date().toISOString().split('T')[0],
      };

      setAuthenticatedUser(updatedUser);
      try {
        localStorage.setItem('sigma_user', JSON.stringify(updatedUser));
      } catch (e) {}

      return { success: true };
    },
    [availableUsers]
  );

  // Logout handler
  const logout = useCallback(() => {
    setAuthenticatedUser(null);
    try {
      localStorage.removeItem('sigma_user');
    } catch (e) {}
  }, []);

  const isAuthenticated = Boolean(authenticatedUser);
  const currentUser: Usuario = authenticatedUser || GUEST_USER;

  const isSuperAdmin = isAuthenticated && currentUser.nivelAcesso === 'SUPERADMIN';
  const isRestrictedToStation = isAuthenticated && currentUser.nivelAcesso === 'OPERADOR_POSTO';
  const isRestrictedToSGB = isAuthenticated && currentUser.nivelAcesso === 'GESTOR_SGB';
  const isReadOnlyGB = isAuthenticated && currentUser.nivelAcesso === 'VISUALIZADOR_GB';

  // Strict Permissions:
  const canManageUsers = isSuperAdmin;
  const canEditStations = isSuperAdmin;
  const canImportData = isSuperAdmin;

  // Mapa Geral disponível para SuperAdmin, Visualizador do GB e Gestor SGB
  const canViewGBMap = isAuthenticated && (isSuperAdmin || isReadOnlyGB || isRestrictedToSGB);

  // Inclusão de material: apenas SuperAdmin e Operador do seu posto cadastrado
  const canCreateMaterial = isAuthenticated && (isSuperAdmin || isRestrictedToStation);

  // Edição de material: SuperAdmin ou Operador estritamente do seu posto
  const canEditMaterial = (material: MaterialOperacional): boolean => {
    if (!isAuthenticated) return false;
    if (isSuperAdmin) return true;
    if (isRestrictedToStation) {
      return (
        material.estacaoId === currentUser.estacaoAutorizadaId ||
        material.estacao === currentUser.estacaoAutorizadaId
      );
    }
    return false;
  };

  // Exclusão de material: SuperAdmin ou Operador estritamente do seu posto
  const canDeleteMaterial = (material: MaterialOperacional): boolean => {
    if (!isAuthenticated) return false;
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
    if (!isAuthenticated) return false;
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
      'Funções restritas ao posto cadastrado: inclusão, exclusão e edição de materiais APENAS do seu posto determinado por Gmail.',
    GESTOR_SGB:
      'Visualiza todos os postos do SGB que lhe é pertinente (ex: 3° SGB), determinado por Gmail específico.',
    VISUALIZADOR_GB:
      'Visualiza o 6° GB todo, apenas consulta e relatórios sem edição de materiais.',
    SUPERADMIN:
      'Acesso exclusivo do Administrador Geral (6gb3sgbadm@gmail.com): gerencia usuários, libera gmails, altera, edita e exclui tudo.',
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
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
        userRoleLabel: isAuthenticated ? roleLabels[currentUser.nivelAcesso] : 'Desconectado',
        userRoleDescription: isAuthenticated
          ? roleDescriptions[currentUser.nivelAcesso]
          : 'Acesso restrito',
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
