import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  ApifyKey, 
  BlitzKey, 
  Run, 
  OutputFile, 
  Notification,
  UserPreferences,
  DashboardStats 
} from '@/types';
import {
  mockUser,
  mockApifyKeys,
  mockBlitzKeys,
  mockRuns,
  mockOutputFiles,
  mockNotifications,
  mockDashboardStats,
} from '@/lib/mockData';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  apifyKeys: ApifyKey[];
  blitzKeys: BlitzKey[];
  runs: Run[];
  files: OutputFile[];
  notifications: Notification[];
  stats: DashboardStats;
  preferences: UserPreferences;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  // Auth
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  // Keys
  addApifyKey: (label: string, key: string) => void;
  updateApifyKey: (id: string, updates: Partial<ApifyKey>) => void;
  deleteApifyKey: (id: string) => void;
  addBlitzKey: (label: string, key: string) => void;
  updateBlitzKey: (id: string, updates: Partial<BlitzKey>) => void;
  deleteBlitzKey: (id: string) => void;
  
  // Runs
  createRun: (toolId: string, fileName: string, config: Record<string, unknown>) => Run;
  pauseRun: (id: string) => void;
  resumeRun: (id: string) => void;
  stopRun: (id: string) => void;
  retryRun: (id: string) => void;
  
  // Files
  downloadFile: (id: string) => void;
  
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Preferences
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  togglePinnedTool: (toolId: string) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  notifications: {
    runCompleted: true,
    runFailed: true,
    keyWarnings: true,
  },
  pinnedTools: ['post-finder', 'blitz-email-enricher', 'csv-deduplicator'],
  defaultKeyStrategy: 'rotate',
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('koldify-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isLoading: false,
        };
      } catch {
        // Fall through to defaults
      }
    }
    
    return {
      user: mockUser,
      isAuthenticated: true, // Start authenticated for demo
      apifyKeys: mockApifyKeys,
      blitzKeys: mockBlitzKeys,
      runs: mockRuns,
      files: mockOutputFiles,
      notifications: mockNotifications,
      stats: mockDashboardStats,
      preferences: defaultPreferences,
      isLoading: false,
    };
  });

  // Persist state to localStorage
  useEffect(() => {
    const { isLoading, ...stateToSave } = state;
    localStorage.setItem('koldify-state', JSON.stringify(stateToSave));
  }, [state]);

  // Simulate job progression
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        runs: prev.runs.map(run => {
          if (run.status === 'running' && run.progress < 100) {
            const newProgress = Math.min(run.progress + Math.random() * 2, 100);
            const newRowsProcessed = Math.floor((newProgress / 100) * run.totalRows);
            
            if (newProgress >= 100) {
              return {
                ...run,
                progress: 100,
                rowsProcessed: run.totalRows,
                status: 'completed' as const,
                stage: 'completed' as const,
                completedAt: new Date().toISOString(),
              };
            }
            
            return {
              ...run,
              progress: Math.round(newProgress),
              rowsProcessed: newRowsProcessed,
            };
          }
          return run;
        }),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, _password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setState(prev => ({
      ...prev,
      user: { ...mockUser, email },
      isAuthenticated: true,
      isLoading: false,
    }));
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
    }));
  };

  const addApifyKey = (label: string, key: string) => {
    const newKey: ApifyKey = {
      id: `apify-${Date.now()}`,
      label,
      keyMasked: `apify_api_****...****${key.slice(-4)}`,
      enabled: true,
      status: 'checking',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      requestsToday: 0,
      successRate: 0,
    };
    
    setState(prev => ({
      ...prev,
      apifyKeys: [...prev.apifyKeys, newKey],
    }));
    
    // Simulate key validation
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        apifyKeys: prev.apifyKeys.map(k => 
          k.id === newKey.id ? { ...k, status: 'active' as const } : k
        ),
      }));
    }, 2000);
  };

  const updateApifyKey = (id: string, updates: Partial<ApifyKey>) => {
    setState(prev => ({
      ...prev,
      apifyKeys: prev.apifyKeys.map(k => 
        k.id === id ? { ...k, ...updates } : k
      ),
    }));
  };

  const deleteApifyKey = (id: string) => {
    setState(prev => ({
      ...prev,
      apifyKeys: prev.apifyKeys.filter(k => k.id !== id),
    }));
  };

  const addBlitzKey = (label: string, key: string) => {
    const newKey: BlitzKey = {
      id: `blitz-${Date.now()}`,
      label,
      keyMasked: `blitz_****...****${key.slice(-4)}`,
      enabled: true,
      status: 'checking',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      requestsToday: 0,
      plan: 'Pro',
      rateLimit: 5000,
    };
    
    setState(prev => ({
      ...prev,
      blitzKeys: [...prev.blitzKeys, newKey],
    }));
    
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        blitzKeys: prev.blitzKeys.map(k => 
          k.id === newKey.id ? { ...k, status: 'active' as const } : k
        ),
      }));
    }, 2000);
  };

  const updateBlitzKey = (id: string, updates: Partial<BlitzKey>) => {
    setState(prev => ({
      ...prev,
      blitzKeys: prev.blitzKeys.map(k => 
        k.id === id ? { ...k, ...updates } : k
      ),
    }));
  };

  const deleteBlitzKey = (id: string) => {
    setState(prev => ({
      ...prev,
      blitzKeys: prev.blitzKeys.filter(k => k.id !== id),
    }));
  };

  const createRun = (toolId: string, fileName: string, config: Record<string, unknown>) => {
    const tool = state.apifyKeys.length > 0 ? 'apify' : 'blitz';
    const newRun: Run = {
      id: `run-${Date.now()}`,
      toolId,
      toolName: toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      toolProvider: tool,
      inputFileName: fileName,
      status: 'running',
      progress: 0,
      rowsProcessed: 0,
      totalRows: Math.floor(Math.random() * 2000) + 500,
      stage: 'uploading',
      startedAt: new Date().toISOString(),
      eta: '~15 min',
      keyLabel: tool === 'apify' ? state.apifyKeys[0]?.label : state.blitzKeys[0]?.label,
    };
    
    setState(prev => ({
      ...prev,
      runs: [newRun, ...prev.runs],
    }));
    
    // Simulate stage progression
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        runs: prev.runs.map(r => 
          r.id === newRun.id ? { ...r, stage: 'preparing' as const } : r
        ),
      }));
    }, 1000);
    
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        runs: prev.runs.map(r => 
          r.id === newRun.id ? { ...r, stage: 'processing' as const, progress: 5 } : r
        ),
      }));
    }, 2000);
    
    return newRun;
  };

  const pauseRun = (id: string) => {
    setState(prev => ({
      ...prev,
      runs: prev.runs.map(r => 
        r.id === id ? { ...r, status: 'paused' as const } : r
      ),
    }));
  };

  const resumeRun = (id: string) => {
    setState(prev => ({
      ...prev,
      runs: prev.runs.map(r => 
        r.id === id ? { ...r, status: 'running' as const } : r
      ),
    }));
  };

  const stopRun = (id: string) => {
    setState(prev => ({
      ...prev,
      runs: prev.runs.map(r => 
        r.id === id ? { 
          ...r, 
          status: 'cancelled' as const,
          completedAt: new Date().toISOString(),
        } : r
      ),
    }));
  };

  const retryRun = (id: string) => {
    const originalRun = state.runs.find(r => r.id === id);
    if (originalRun) {
      const newRun: Run = {
        ...originalRun,
        id: `run-${Date.now()}`,
        status: 'running',
        progress: 0,
        rowsProcessed: 0,
        stage: 'uploading',
        startedAt: new Date().toISOString(),
        completedAt: undefined,
        error: undefined,
      };
      
      setState(prev => ({
        ...prev,
        runs: [newRun, ...prev.runs],
      }));
    }
  };

  const downloadFile = (id: string) => {
    const file = state.files.find(f => f.id === id);
    if (file) {
      // Simulate download
      const blob = new Blob(['col1,col2,col3\ndata1,data2,data3'], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }));
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...prefs },
    }));
  };

  const togglePinnedTool = (toolId: string) => {
    setState(prev => {
      const pinned = prev.preferences.pinnedTools;
      const newPinned = pinned.includes(toolId)
        ? pinned.filter(id => id !== toolId)
        : [...pinned, toolId];
      
      return {
        ...prev,
        preferences: { ...prev.preferences, pinnedTools: newPinned },
      };
    });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      logout,
      addApifyKey,
      updateApifyKey,
      deleteApifyKey,
      addBlitzKey,
      updateBlitzKey,
      deleteBlitzKey,
      createRun,
      pauseRun,
      resumeRun,
      stopRun,
      retryRun,
      downloadFile,
      markNotificationRead,
      markAllNotificationsRead,
      updatePreferences,
      togglePinnedTool,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
