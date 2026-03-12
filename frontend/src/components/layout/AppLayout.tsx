import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { FloatingHelpFab } from './FloatingHelpFab';
import { useApp } from '@/contexts/AppContext';

export function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useApp();
  const isDashboardRoute = location.pathname === '/dashboard';

  if (isLoading) {
    return (
      <div className="koldify-shell-bg relative flex h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-55" />
        <div className="relative flex items-center gap-3 rounded-2xl border border-border/70 bg-card/90 px-5 py-4 shadow-[0_22px_42px_-30px_hsl(var(--foreground)/0.8)]">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
          <p className="text-sm font-medium text-foreground/90">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin users should never see the user portal
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="koldify-shell-bg relative flex h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-50" />
      <AppSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className={isDashboardRoute ? 'relative flex-1 overflow-hidden px-2 pb-2 sm:px-3 sm:pb-3' : 'relative flex-1 overflow-auto px-2 pb-2 sm:px-3 sm:pb-3'}>
          <div className={isDashboardRoute ? 'h-full rounded-[26px] border border-border/60 bg-background/55 backdrop-blur-sm' : 'min-h-full rounded-[26px] border border-border/60 bg-background/55 backdrop-blur-sm'}>
            <Outlet />
          </div>
        </main>
      </div>
      <FloatingHelpFab />
    </div>
  );
}
