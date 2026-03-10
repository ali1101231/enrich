import React, { createContext, useContext, ReactNode } from 'react';
import {
  useAdminUsers,
  useAdminKeys,
  useAdminAssignments,
  useAdminCreateKey,
  useAdminSetKeyActive,
  useAdminUpdateKeyRateLimit,
  useAdminManualAssign,
  useAdminAutoAssign,
  useAdminDeactivateAssignment,
  useAdminDeactivateUserAssignments,
} from '@/hooks/useApi';
import type { AdminUserItem, AdminKeyItem, AssignmentItem } from '@/lib/api';

interface AdminContextType {
  users: AdminUserItem[];
  keys: AdminKeyItem[];
  assignments: AssignmentItem[];
  isLoading: boolean;
  // Key management
  addKey: (label: string, rawKey: string) => Promise<void>;
  setKeyActive: (keyId: string, isActive: boolean) => Promise<void>;
  updateKeyRateLimit: (keyId: string, requestsPerSecond: number) => Promise<void>;
  // Assignment management
  manualAssign: (userId: string, apiKeyId: string) => Promise<void>;
  autoAssign: (userId: string) => Promise<void>;
  deactivateAssignment: (assignmentId: string) => Promise<void>;
  deactivateUserAssignments: (userId: string) => Promise<void>;
  // Stats
  stats: {
    totalUsers: number;
    activeUsers: number;
    activeKeys: number;
    totalAssignments: number;
  };
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: keys = [], isLoading: keysLoading } = useAdminKeys();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAdminAssignments();

  const createKeyMutation = useAdminCreateKey();
  const setKeyActiveMutation = useAdminSetKeyActive();
  const updateKeyRateLimitMutation = useAdminUpdateKeyRateLimit();
  const manualAssignMutation = useAdminManualAssign();
  const autoAssignMutation = useAdminAutoAssign();
  const deactivateAssignmentMutation = useAdminDeactivateAssignment();
  const deactivateUserAssignmentsMutation = useAdminDeactivateUserAssignments();

  const isLoading = usersLoading || keysLoading || assignmentsLoading;

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    activeKeys: keys.filter(k => k.isActive).length,
    totalAssignments: assignments.filter(a => a.isActive).length,
  };

  const addKey = async (label: string, rawKey: string) => {
    await createKeyMutation.mutateAsync({ label, rawKey });
  };

  const setKeyActive = async (keyId: string, isActive: boolean) => {
    await setKeyActiveMutation.mutateAsync({ keyId, isActive });
  };

  const updateKeyRateLimit = async (keyId: string, requestsPerSecond: number) => {
    await updateKeyRateLimitMutation.mutateAsync({ keyId, requestsPerSecond });
  };

  const manualAssign = async (userId: string, apiKeyId: string) => {
    await manualAssignMutation.mutateAsync({ userId, apiKeyId });
  };

  const autoAssign = async (userId: string) => {
    await autoAssignMutation.mutateAsync(userId);
  };

  const deactivateAssignment = async (assignmentId: string) => {
    await deactivateAssignmentMutation.mutateAsync(assignmentId);
  };

  const deactivateUserAssignments = async (userId: string) => {
    await deactivateUserAssignmentsMutation.mutateAsync(userId);
  };

  return (
    <AdminContext.Provider value={{
      users,
      keys,
      assignments,
      isLoading,
      addKey,
      setKeyActive,
      updateKeyRateLimit,
      manualAssign,
      autoAssign,
      deactivateAssignment,
      deactivateUserAssignments,
      stats,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
