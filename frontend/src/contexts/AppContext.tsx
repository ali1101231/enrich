import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  UserPreferences,
} from '@/types';
import { authApi, type AuthUser, ApiError } from '@/lib/api';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  preferences: UserPreferences;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  // Auth
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, displayName?: string) => Promise<string | null>;
  logout: () => void;
  authError: string | null;
  
  // Preferences
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  togglePinnedTool: (toolId: string) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  notifications: {
    runCompleted: true,
    runFailed: true,
    keyWarnings: true,
  },
  pinnedTools: ['email-enricher', 'phone-enricher', 'company-enricher', 'domain-to-linkedin'],
  defaultKeyStrategy: 'rotate',
};

const AppContext = createContext<AppContextType | null>(null);

function authUserToUser(u: AuthUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.displayName ?? u.email,
    role: u.role === 'admin' ? 'admin' : 'user',
    plan: 'free',
    createdAt: new Date().toISOString(),
    credits: u.credits ?? 0,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AppState>({
    user: null,
    isAuthenticated: false,
    preferences: (() => {
      try {
        const saved = localStorage.getItem('koldify-preferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Migrate old blitz-* pinned tool IDs
          if (parsed.pinnedTools) {
            parsed.pinnedTools = parsed.pinnedTools.map((id: string) =>
              id.startsWith('blitz-') ? id.replace('blitz-', '') : id
            );
          }
          return { ...defaultPreferences, ...parsed };
        }
        return defaultPreferences;
      } catch {
        return defaultPreferences;
      }
    })(),
    isLoading: true,
  });

  const [authError, setAuthError] = useState<string | null>(null);

  // On mount, try to restore session from token
  useEffect(() => {
    const token = localStorage.getItem('koldify-token');
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    authApi.me()
      .then(authUser => {
        setState(prev => ({
          ...prev,
          user: authUserToUser(authUser),
          isAuthenticated: true,
          isLoading: false,
        }));
      })
      .catch(() => {
        localStorage.removeItem('koldify-token');
        setState(prev => ({ ...prev, isLoading: false }));
      });
  }, []);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('koldify-preferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Apply theme preference to the document root so sidebar toggle and settings stay in sync.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const resolvedTheme = state.preferences.theme === 'system'
        ? (mediaQuery.matches ? 'dark' : 'light')
        : state.preferences.theme;

      root.classList.toggle('dark', resolvedTheme === 'dark');
      root.style.colorScheme = resolvedTheme;
    };

    applyTheme();

    if (state.preferences.theme !== 'system') {
      return;
    }

    const handleChange = () => applyTheme();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [state.preferences.theme]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    setAuthError(null);
    try {
      const { user: authUser, token } = await authApi.login(email, password);
      localStorage.setItem('koldify-token', token);
      setState(prev => ({
        ...prev,
        user: authUserToUser(authUser),
        isAuthenticated: true,
      }));
      return null;
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Login failed';
      setAuthError(msg);
      return msg;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string): Promise<string | null> => {
    setAuthError(null);
    try {
      const { user: authUser, token } = await authApi.register(email, password, displayName);
      localStorage.setItem('koldify-token', token);
      setState(prev => ({
        ...prev,
        user: authUserToUser(authUser),
        isAuthenticated: true,
      }));
      return null;
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Registration failed';
      setAuthError(msg);
      return msg;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('koldify-token');
    queryClient.clear();
    setState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
    }));
  }, [queryClient]);

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
      register,
      logout,
      authError,
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
