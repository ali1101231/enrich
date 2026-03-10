import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Play,
  Sparkles,
  FolderOutput,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserSearch,
  Building2,
  Users,
  Globe,
  Linkedin,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Runs', href: '/runs', icon: Play, badge: 2 },
];

const tools: NavItem[] = [
  { title: 'People Finder', href: '/tools/people-finder', icon: UserSearch },
  { title: 'Company Finder', href: '/tools/company-finder', icon: Building2 },
  { title: 'Employee Finder', href: '/tools/employee-finder', icon: Users },
  { title: 'LinkedIn → Domain', href: '/tools/linkedin-to-domain', icon: Linkedin },
  { title: 'Domain → Company', href: '/tools/domain-to-company', icon: Globe },
];

const bottomNavItems: NavItem[] = [
  { title: 'Files', href: '/files', icon: FolderOutput },
  { title: 'Pricing', href: '/pricing', icon: CreditCard },
  { title: 'Settings', href: '/settings/account', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  const NavLink = ({ item, showText = true }: { item: NavItem; showText?: boolean }) => (
    <Link
      to={item.href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        isActive(item.href)
          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
      )}
    >
      <item.icon className={cn(
        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
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
        'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-koldify shadow-glow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-koldify-text tracking-tight">Koldify</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-koldify shadow-glow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7 text-muted-foreground hover:text-foreground', collapsed && 'hidden')}
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} showText={!collapsed} />
          ))}

          <div className="my-4 mx-2 border-t border-sidebar-border" />

          {!collapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Tools
            </div>
          )}
          {tools.map((item) => (
            <NavLink key={item.href} item={item} showText={!collapsed} />
          ))}

          <div className="my-4 mx-2 border-t border-sidebar-border" />

          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} showText={!collapsed} />
          ))}
        </nav>
      </ScrollArea>

      {/* Expand Button */}
      {collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
