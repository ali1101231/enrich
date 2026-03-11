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
  ChevronDown,
  Building2,
  Globe,
  Linkedin,
  CreditCard,
  Mail,
  Phone,
  BookOpen,
  Newspaper,
  Tag,
  BarChart3,
  HelpCircle,
  LifeBuoy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const billingItems: NavItem[] = [
  { title: 'Pricing', href: '/pricing', icon: CreditCard },
  { title: 'Offers', href: '/offers', icon: Tag },
  { title: 'Usage', href: '/usage', icon: BarChart3 },
];

const helpItems: NavItem[] = [
  { title: 'Guide', href: '/guide', icon: BookOpen },
  { title: 'News', href: '/news', icon: Newspaper },
  { title: 'Support', href: '/support', icon: LifeBuoy },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { data: batches } = useBatches();
  const activeRunCount = batches?.filter(b => b.status === 'RUNNING' || b.status === 'QUEUED').length ?? 0;

  const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Runs', href: '/runs', icon: Play, badge: activeRunCount || undefined },
    { title: 'Files', href: '/files', icon: FolderOutput },
  ];

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
            <span className="text-lg font-bold gradient-koldify-text tracking-tight">Enrich it</span>
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

          {/* Billing collapsible */}
          <button
            onClick={() => setBillingOpen(!billingOpen)}
            className={cn(
              'group flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              billingItems.some(i => isActive(i.href))
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <CreditCard className={cn(
              'h-[18px] w-[18px] flex-shrink-0 transition-colors',
              billingItems.some(i => isActive(i.href)) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
            )} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">Billing</span>
                <ChevronDown className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  billingOpen && 'rotate-180'
                )} />
              </>
            )}
          </button>
          {billingOpen && !collapsed && (
            <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
              {billingItems.map((item) => (
                <NavLink key={item.href} item={item} showText />
              ))}
            </div>
          )}

          {/* Help collapsible */}
          <button
            onClick={() => setHelpOpen(!helpOpen)}
            className={cn(
              'group flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              helpItems.some(i => isActive(i.href))
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <HelpCircle className={cn(
              'h-[18px] w-[18px] flex-shrink-0 transition-colors',
              helpItems.some(i => isActive(i.href)) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
            )} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">Help</span>
                <ChevronDown className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  helpOpen && 'rotate-180'
                )} />
              </>
            )}
          </button>
          {helpOpen && !collapsed && (
            <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
              {helpItems.map((item) => (
                <NavLink key={item.href} item={item} showText />
              ))}
            </div>
          )}

          <NavLink item={{ title: 'Settings', href: '/settings/account', icon: Settings }} showText={!collapsed} />
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
