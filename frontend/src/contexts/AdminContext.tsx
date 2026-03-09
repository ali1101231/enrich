import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Admin Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  plan: 'starter' | 'business' | 'enterprise';
  creditsTotal: number;
  creditsUsed: number;
  assignedKeyIds: string[];
  runsTotal: number;
  lastActive: string;
  createdAt: string;
}

export interface AdminKey {
  id: string;
  label: string;
  keyMasked: string;
  status: 'active' | 'rate-limited' | 'invalid';
  creditsTotal: number;
  creditsUsed: number;
  assignedUserCount: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: 'run_started' | 'run_completed' | 'run_failed' | 'login' | 'file_download';
  details: string;
  creditsUsed: number;
  timestamp: string;
}

// Mock Data
const mockAdminUsers: AdminUser[] = [
  {
    id: 'user-1',
    name: 'Alex Chen',
    email: 'alex@company.com',
    role: 'user',
    status: 'active',
    plan: 'business',
    creditsTotal: 200000,
    creditsUsed: 87450,
    assignedKeyIds: ['key-1', 'key-2'],
    runsTotal: 156,
    lastActive: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Sarah Miller',
    email: 'sarah@startup.io',
    role: 'user',
    status: 'active',
    plan: 'starter',
    creditsTotal: 100000,
    creditsUsed: 95200,
    assignedKeyIds: ['key-1'],
    runsTotal: 89,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'user-3',
    name: 'Marcus Johnson',
    email: 'marcus@enterprise.co',
    role: 'user',
    status: 'active',
    plan: 'enterprise',
    creditsTotal: 500000,
    creditsUsed: 234100,
    assignedKeyIds: ['key-1', 'key-2', 'key-3'],
    runsTotal: 412,
    lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: '2023-11-20T14:00:00Z',
  },
  {
    id: 'user-4',
    name: 'Emily Wong',
    email: 'emily@growth.tech',
    role: 'user',
    status: 'suspended',
    plan: 'business',
    creditsTotal: 200000,
    creditsUsed: 200000,
    assignedKeyIds: ['key-2'],
    runsTotal: 201,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    createdAt: '2024-01-05T09:00:00Z',
  },
  {
    id: 'user-5',
    name: 'James Park',
    email: 'james@newuser.com',
    role: 'user',
    status: 'pending',
    plan: 'starter',
    creditsTotal: 100000,
    creditsUsed: 0,
    assignedKeyIds: [],
    runsTotal: 0,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const mockAdminKeys: AdminKey[] = [
  {
    id: 'key-1',
    label: 'Primary Pool Key',
    keyMasked: 'blitz_****...****7x9K',
    status: 'active',
    creditsTotal: 1000000,
    creditsUsed: 456200,
    assignedUserCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'key-2',
    label: 'Secondary Pool Key',
    keyMasked: 'blitz_****...****2mPq',
    status: 'active',
    creditsTotal: 500000,
    creditsUsed: 234800,
    assignedUserCount: 3,
    createdAt: '2024-01-15T00:00:00Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'key-3',
    label: 'Enterprise Dedicated',
    keyMasked: 'blitz_****...****8nLz',
    status: 'active',
    creditsTotal: 2000000,
    creditsUsed: 125750,
    assignedUserCount: 1,
    createdAt: '2024-02-01T00:00:00Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

const mockActivity: UserActivity[] = [
  { id: 'act-1', userId: 'user-3', userName: 'Marcus Johnson', action: 'run_completed', details: 'People Finder - 2,500 rows', creditsUsed: 2500, timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'act-2', userId: 'user-1', userName: 'Alex Chen', action: 'run_started', details: 'Company Finder - 1,200 rows', creditsUsed: 0, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'act-3', userId: 'user-2', userName: 'Sarah Miller', action: 'run_failed', details: 'Employee Finder - Rate limit', creditsUsed: 450, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'act-4', userId: 'user-3', userName: 'Marcus Johnson', action: 'file_download', details: 'people_results.csv', creditsUsed: 0, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 'act-5', userId: 'user-1', userName: 'Alex Chen', action: 'run_completed', details: 'LinkedIn → Domain - 800 rows', creditsUsed: 800, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'act-6', userId: 'user-5', userName: 'James Park', action: 'login', details: 'First login', creditsUsed: 0, timestamp: new Date().toISOString() },
];

interface AdminContextType {
  users: AdminUser[];
  keys: AdminKey[];
  activity: UserActivity[];
  isAdmin: boolean;
  // User management
  updateUser: (id: string, updates: Partial<AdminUser>) => void;
  suspendUser: (id: string) => void;
  activateUser: (id: string) => void;
  assignKeyToUser: (userId: string, keyId: string) => void;
  removeKeyFromUser: (userId: string, keyId: string) => void;
  setUserCredits: (userId: string, credits: number) => void;
  // Key management
  addKey: (label: string, key: string, credits: number) => void;
  updateKey: (id: string, updates: Partial<AdminKey>) => void;
  deleteKey: (id: string) => void;
  // Stats
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalCreditsUsed: number;
    totalCreditsAvailable: number;
    activeKeys: number;
  };
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('koldify-admin-users');
    return saved ? JSON.parse(saved) : mockAdminUsers;
  });

  const [keys, setKeys] = useState<AdminKey[]>(() => {
    const saved = localStorage.getItem('koldify-admin-keys');
    return saved ? JSON.parse(saved) : mockAdminKeys;
  });

  const [activity, setActivity] = useState<UserActivity[]>(mockActivity);

  useEffect(() => {
    localStorage.setItem('koldify-admin-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('koldify-admin-keys', JSON.stringify(keys));
  }, [keys]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalCreditsUsed: users.reduce((acc, u) => acc + u.creditsUsed, 0),
    totalCreditsAvailable: users.reduce((acc, u) => acc + u.creditsTotal, 0),
    activeKeys: keys.filter(k => k.status === 'active').length,
  };

  const updateUser = (id: string, updates: Partial<AdminUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const suspendUser = (id: string) => {
    updateUser(id, { status: 'suspended' });
  };

  const activateUser = (id: string) => {
    updateUser(id, { status: 'active' });
  };

  const assignKeyToUser = (userId: string, keyId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && !u.assignedKeyIds.includes(keyId)) {
        return { ...u, assignedKeyIds: [...u.assignedKeyIds, keyId] };
      }
      return u;
    }));
    setKeys(prev => prev.map(k => {
      if (k.id === keyId) {
        return { ...k, assignedUserCount: k.assignedUserCount + 1 };
      }
      return k;
    }));
  };

  const removeKeyFromUser = (userId: string, keyId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, assignedKeyIds: u.assignedKeyIds.filter(id => id !== keyId) };
      }
      return u;
    }));
    setKeys(prev => prev.map(k => {
      if (k.id === keyId) {
        return { ...k, assignedUserCount: Math.max(0, k.assignedUserCount - 1) };
      }
      return k;
    }));
  };

  const setUserCredits = (userId: string, credits: number) => {
    updateUser(userId, { creditsTotal: credits });
  };

  const addKey = (label: string, keyValue: string, credits: number) => {
    const newKey: AdminKey = {
      id: `key-${Date.now()}`,
      label,
      keyMasked: `blitz_****...****${keyValue.slice(-4)}`,
      status: 'active',
      creditsTotal: credits,
      creditsUsed: 0,
      assignedUserCount: 0,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    setKeys(prev => [...prev, newKey]);
  };

  const updateKey = (id: string, updates: Partial<AdminKey>) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k));
  };

  const deleteKey = (id: string) => {
    // Remove key from all users first
    setUsers(prev => prev.map(u => ({
      ...u,
      assignedKeyIds: u.assignedKeyIds.filter(kid => kid !== id)
    })));
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  return (
    <AdminContext.Provider value={{
      users,
      keys,
      activity,
      isAdmin: true, // For demo, always admin
      updateUser,
      suspendUser,
      activateUser,
      assignKeyToUser,
      removeKeyFromUser,
      setUserCredits,
      addKey,
      updateKey,
      deleteKey,
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
