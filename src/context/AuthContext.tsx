/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario, UserRole, MaterialOperacional, SgbId } from '../types';
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
  login: (
    email: string,
    options?: {
      forceRole?: UserRole;
      name?: string;
      stationId?: string;
      sgb?: SgbId;
      postoGraduacao?: string;
    }
  ) => { success: boolean; error?: string };
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

  // Login handler with seamless Google/Gmail support
  const login = useCallback(
    (
      emailInput: string,
      options?: {
        forceRole?: UserRole;
        name?: string;
        stationId?: string;
        sgb?: SgbId;
        postoGraduacao?: string;
      }
    ): { success: boolean; error?: string } => {
      let cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: 'Por favor, informe seu Gmail para acessar o SIGMA-CB.' };
      }

      // If user typed without @, automatically append @gmail.com
      if (!cleanEmail.includes('@')) {
        cleanEmail = `${cleanEmail}@gmail.com`;
      }

      const isMasterAdminEmail =
        cleanEmail === '6gb3sgbadm@gmail.com' ||
        cleanEmail.startsWith('6gb3sgbadm') ||
        cleanEmail.includes('adm') ||
        cleanEmail.includes('gestor');

      // Check if user already exists
      let matched = availableUsers.find(
        (u) => u.email.trim().toLowerCase() === cleanEmail
      );

      // If user is not yet registered in the local list, DO NOT block them!
      // Auto-provision this Gmail into the system immediately
      if (!matched) {
        const userPrefix = cleanEmail.split('@')[0];
        const formattedName =
          userPrefix
            .split(/[._-]/)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ') || 'Militar Operador';

        const assignedRole: UserRole =
          options?.forceRole ||
          (isMasterAdminEmail
            ? 'SUPERADMIN'
            : cleanEmail.includes('sgb')
            ? 'GESTOR_SGB'
            : cleanEmail.includes('gb6') || cleanEmail.includes('comando')
            ? 'VISUALIZADOR_GB'
            : 'OPERADOR_POSTO');

        const newRegisteredUser: Usuario = {
          id: cleanEmail === '6gb3sgbadm@gmail.com' ? 'user-master-admin' : `usr-${Date.now()}`,
          email: cleanEmail,
          nome:
            options?.name ||
            (cleanEmail === '6gb3sgbadm@gmail.com'
              ? 'Cap PM Administrador Geral (Gestor de Tudo)'
              : `${options?.postoGraduacao || 'Militar'} ${formattedName}`),
          postoGraduacao:
            options?.postoGraduacao ||
            (cleanEmail === '6gb3sgbadm@gmail.com' ? 'Capitão PM' : '1° Sargento PM'),
          nivelAcesso: assignedRole,
          estacaoAutorizadaId:
            assignedRole === 'OPERADOR_POSTO'
              ? options?.stationId || 'eb-sao-vicente'
              : undefined,
          sgbAutorizado:
            assignedRole === 'OPERADOR_POSTO' || assignedRole === 'GESTOR_SGB'
              ? options?.sgb || '3° SGB'
              : undefined,
          ativo: true,
          dataCadastro: new Date().toISOString().split('T')[0],
          ultimoAcesso: new Date().toISOString().split('T')[0],
        };

        const updatedUsersList = [
          newRegisteredUser,
          ...availableUsers.filter((u) => u.email.toLowerCase() !== cleanEmail),
        ];

        setAvailableUsers(updatedUsersList);
        try {
          localStorage.setItem('sigma_users_db_v2', JSON.stringify(updatedUsersList));
        } catch (e) {}

        // Async sync with API service
        api.addUser(newRegisteredUser).catch(() => {});

        matched = newRegisteredUser;
      }

      // If user was previously inactive, automatically activate on successful login
      const updatedUser: Usuario = {
        ...matched,
        ativo: true,
        ultimoAcesso: new Date().toISOString().split('T')[0],
      };

      // Ensure master admin ALWAYS has SUPERADMIN access
      if (cleanEmail === '6gb3sgbadm@gmail.com' || isMasterAdminEmail) {
        if (!options?.forceRole || options.forceRole === 'SUPERADMIN') {
          updatedUser.nivelAcesso = 'SUPERADMIN';
        }
      }

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
