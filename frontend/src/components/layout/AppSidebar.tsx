import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Play,
  Sparkles,
  FolderOutput,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Building2,
  Linkedin,
  CreditCard,
  Mail,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { useBatches } from '@/hooks/useApi';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const tools: NavItem[] = [
  { title: 'Email Enricher', href: '/tools/email-enricher', icon: Mail },
  { title: 'Phone Finder', href: '/tools/phone-enricher', icon: Phone },
  { title: 'Company Enricher', href: '/tools/company-enricher', icon: Building2 },
  { title: 'Domain → LinkedIn', href: '/tools/domain-to-linkedin', icon: Linkedin },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { preferences, updatePreferences, logout } = useApp();
  const { data: batches } = useBatches();
  const activeRunCount = batches?.filter(b => b.status === 'RUNNING' || b.status === 'QUEUED').length ?? 0;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = preferences.theme === 'dark' || (preferences.theme === 'system' && prefersDark);

  const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Runs', href: '/runs', icon: Play, badge: activeRunCount || undefined },
    { title: 'Files', href: '/files', icon: FolderOutput },
  ];

  const footerNavItems: NavItem[] = [
    { title: 'Pricing', href: '/pricing', icon: CreditCard },
    { title: 'Settings', href: '/settings/account', icon: Settings },
  ];

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  const NavLink = ({ item, showText = true }: { item: NavItem; showText?: boolean }) => (
    <Link
      to={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium motion-200',
        isActive(item.href)
          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2),0_14px_24px_-20px_hsl(var(--primary)/0.75)]'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
      )}
    >
      <item.icon className={cn(
        'h-[18px] w-[18px] flex-shrink-0 transition-colors',
        isActive(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
      )} />
      {showText && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full gradient-koldify text-[10px] font-bold text-white px-1.5">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border/90 bg-sidebar/95 backdrop-blur transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[232px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-[74px] items-center justify-between border-b border-sidebar-border/90 px-4">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-koldify shadow-glow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-[1.35rem] font-bold gradient-koldify-text tracking-tight">Enrich it</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-koldify shadow-glow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground', collapsed && 'hidden')}
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1.5 px-3">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} showText={!collapsed} />
          ))}

          <div className="mx-2 my-4 border-t border-sidebar-border/85" />

          {!collapsed && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Tools
            </div>
          )}
          {tools.map((item) => (
            <NavLink key={item.href} item={item} showText={!collapsed} />
          ))}

        </nav>
      </ScrollArea>

      {!collapsed && (
        <div className="border-t border-sidebar-border/85 p-3">
          <nav className="space-y-1.5">
            {footerNavItems.map((item) => (
              <NavLink key={item.href} item={item} showText />
            ))}
            <button
              type="button"
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground motion-200 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-[18px] w-[18px] flex-shrink-0 text-muted-foreground group-hover:text-primary" />
              <span className="flex-1 truncate text-left">Log Out</span>
            </button>
          </nav>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-sidebar-border/85 bg-sidebar-accent/55 px-3 py-2.5">
            <Moon className="h-4 w-4 text-primary" />
            <Switch
              checked={isDark}
              onCheckedChange={(checked) => updatePreferences({ theme: checked ? 'dark' : 'light' })}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
            />
            <Sun className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      {/* Expand Button */}
      {collapsed && (
        <div className="border-t border-sidebar-border/85 p-3">
          <div className="space-y-2">
            {footerNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                title={item.title}
                aria-label={item.title}
                className={cn(
                  'flex h-10 w-full items-center justify-center rounded-xl text-sidebar-foreground motion-200 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                  isActive(item.href) && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2),0_14px_24px_-20px_hsl(var(--primary)/0.75)]'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </Link>
            ))}

            <button
              type="button"
              title="Log Out"
              aria-label="Log Out"
              onClick={logout}
              className="flex h-10 w-full items-center justify-center rounded-xl text-sidebar-foreground motion-200 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>

            <div className="flex h-10 items-center justify-center rounded-xl border border-sidebar-border/85 bg-sidebar-accent/55">
              <button
                type="button"
                title="Light mode"
                aria-label="Light mode"
                onClick={() => updatePreferences({ theme: 'light' })}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                  !isDark ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Dark mode"
                aria-label="Dark mode"
                onClick={() => updatePreferences({ theme: 'dark' })}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                  isDark ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-full rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
