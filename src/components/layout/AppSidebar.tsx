import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Play,
  Zap,
  Sparkles,
  FileSpreadsheet,
  FolderOutput,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageSquare,
  Heart,
  Mail,
  UserPlus,
  Contact,
  Send,
  Key,
  Phone,
  AtSign,
  Smartphone,
  MailPlus,
  Globe,
  Linkedin,
  Layers,
  Users,
  Clock,
  Scissors,
  Combine,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  children?: NavItem[];
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Runs', href: '/runs', icon: Play, badge: 2 },
];

const apifyTools: NavItem[] = [
  { title: 'Post Finder', href: '/apify/post-finder', icon: Search },
  { title: 'Reaction Scraper', href: '/apify/reaction-scraper', icon: Heart },
  { title: 'Comment Scraper', href: '/apify/linkedin-comment-scraper', icon: MessageSquare },
  { title: 'Email Enricher', href: '/apify/apify-email-enricher', icon: Mail },
  { title: 'Profile Enhancer', href: '/apify/linkedin-profile-enhancer', icon: UserPlus },
  { title: 'Contact Scraper', href: '/apify/contact-details-scraper', icon: Contact },
  { title: 'InMail Checker', href: '/apify/inmail-checker', icon: Send },
];

const blitzTools: NavItem[] = [
  { title: 'Key Info', href: '/blitz/blitz-key-info', icon: Key },
  { title: 'Reverse Phone', href: '/blitz/reverse-phone', icon: Phone },
  { title: 'Reverse Email', href: '/blitz/reverse-email', icon: AtSign },
  { title: 'Find Mobile', href: '/blitz/find-mobile-phone', icon: Smartphone },
  { title: 'Email Enricher', href: '/blitz/blitz-email-enricher', icon: MailPlus },
  { title: 'LinkedIn → Domain', href: '/blitz/linkedin-to-domain', icon: Globe },
  { title: 'Domain → LinkedIn', href: '/blitz/domain-to-linkedin', icon: Linkedin },
  { title: 'Waterfall ICP', href: '/blitz/waterfall-icp', icon: Layers },
  { title: 'Employee Finder', href: '/blitz/employee-finder', icon: Users },
  { title: 'Date/Time', href: '/blitz/current-datetime', icon: Clock },
];

const csvTools: NavItem[] = [
  { title: 'CSV Splitter', href: '/csv/csv-splitter', icon: Scissors },
  { title: 'CSV Merger', href: '/csv/csv-merger', icon: Combine },
  { title: 'CSV Deduplicator', href: '/csv/csv-deduplicator', icon: Copy },
];

const bottomNavItems: NavItem[] = [
  { title: 'Files', href: '/files', icon: FolderOutput },
  { title: 'Settings', href: '/settings/keys', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [apifyOpen, setApifyOpen] = useState(location.pathname.startsWith('/apify'));
  const [blitzOpen, setBlitzOpen] = useState(location.pathname.startsWith('/blitz'));
  const [csvOpen, setCsvOpen] = useState(location.pathname.startsWith('/csv'));

  const isActive = (href: string) => location.pathname === href;
  const isActiveGroup = (prefix: string) => location.pathname.startsWith(prefix);

  const NavLink = ({ item, showText = true }: { item: NavItem; showText?: boolean }) => (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive(item.href) 
          ? 'bg-primary/10 text-primary' 
          : 'text-sidebar-foreground'
      )}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      {showText && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1.5">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  const ToolGroup = ({ 
    title, 
    icon: Icon, 
    tools, 
    open, 
    onOpenChange, 
    prefix 
  }: { 
    title: string; 
    icon: React.ElementType; 
    tools: NavItem[]; 
    open: boolean; 
    onOpenChange: (open: boolean) => void;
    prefix: string;
  }) => (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isActiveGroup(prefix)
              ? 'bg-primary/10 text-primary'
              : 'text-sidebar-foreground'
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{title}</span>
              <ChevronRight className={cn(
                'h-4 w-4 transition-transform duration-200',
                open && 'rotate-90'
              )} />
            </>
          )}
        </button>
      </CollapsibleTrigger>
      {!collapsed && (
        <CollapsibleContent className="mt-1 space-y-0.5 pl-4">
          {tools.map((tool) => (
            <NavLink key={tool.href} item={tool} />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-koldify">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-koldify-text">Koldify</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-koldify">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-sidebar-foreground', collapsed && 'hidden')}
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {/* Main Nav */}
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} showText={!collapsed} />
          ))}

          {/* Divider */}
          <div className="my-4 border-t border-sidebar-border" />

          {/* Tool Groups */}
          <ToolGroup
            title="Apify Tools"
            icon={Zap}
            tools={apifyTools}
            open={apifyOpen && !collapsed}
            onOpenChange={setApifyOpen}
            prefix="/apify"
          />
          
          <ToolGroup
            title="Blitz Tools"
            icon={Sparkles}
            tools={blitzTools}
            open={blitzOpen && !collapsed}
            onOpenChange={setBlitzOpen}
            prefix="/blitz"
          />
          
          <ToolGroup
            title="CSV Tools"
            icon={FileSpreadsheet}
            tools={csvTools}
            open={csvOpen && !collapsed}
            onOpenChange={setCsvOpen}
            prefix="/csv"
          />

          {/* Divider */}
          <div className="my-4 border-t border-sidebar-border" />

          {/* Bottom Nav */}
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} showText={!collapsed} />
          ))}
        </nav>
      </ScrollArea>

      {/* Expand Button */}
      {collapsed && (
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8 text-sidebar-foreground"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
