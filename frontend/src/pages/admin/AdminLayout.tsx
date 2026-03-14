import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Key,
  Sparkles,
  Activity,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  ChevronDown,
  Sun,
  Moon,
  FileText,
  Package,
  Wrench,
  Tag,
  BookOpen,
  Newspaper,
  Image,
  MessageSquare,
  HelpCircle,
  BadgeDollarSign,
  Inbox,
  BarChart3,
  LifeBuoy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminProvider } from '@/contexts/AdminContext';
import { useApp } from '@/contexts/AppContext';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const appNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, end: true },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'API Keys', href: '/admin/keys', icon: Key },
  { title: 'Tools', href: '/admin/tools', icon: Wrench },
  { title: 'Packages', href: '/admin/packages', icon: Package },
  { title: 'Offers', href: '/admin/offers', icon: Tag },
  { title: 'Guides', href: '/admin/guides', icon: BookOpen },
  { title: 'News', href: '/admin/news', icon: Newspaper },
  { title: 'Support', href: '/admin/support', icon: LifeBuoy },
  { title: 'Usage', href: '/admin/usage', icon: BarChart3 },
  { title: 'Activity', href: '/admin/activity', icon: Activity },
  { title: 'Files', href: '/admin/files', icon: FileText },
];

const websiteNavItems: NavItem[] = [
  { title: 'Website Logos', href: '/admin/website/logos', icon: Image },
  { title: 'Website Testimonials', href: '/admin/website/testimonials', icon: MessageSquare },
  { title: 'Website FAQs', href: '/admin/website/faqs', icon: HelpCircle },
  { title: 'Website Pricing', href: '/admin/website/pricing', icon: BadgeDollarSign },
  { title: 'Contact Inbox', href: '/admin/contact-submissions', icon: Inbox },
];

const navSections: NavSection[] = [
  { title: 'App', items: appNavItems },
  { title: 'Website', items: websiteNavItems },
];

const bottomNavItems: NavItem[] = [
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, preferences, updatePreferences } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const isDark = preferences.theme === 'dark';

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const isActive = (href: string, end?: boolean) => {
    if (end) return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ item, showText = true }: { item: NavItem; showText?: boolean }) => (
    <Link
      to={item.href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        isActive(item.href, item.end)
          ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
      )}
    >
      <item.icon className={cn(
        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
        isActive(item.href, item.end) ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
      )} />
      {showText && <span className="flex-1 truncate">{item.title}</span>}
    </Link>
  );

  return (
    <AdminProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar - matching user portal style */}
        <aside
          className={cn(
            'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
            collapsed ? 'w-[68px]' : 'w-64'
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            {!collapsed && (
              <Link to="/admin" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-koldify shadow-glow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold gradient-koldify-text tracking-tight leading-tight">Koldify</span>
                  <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Admin</span>
                </div>
              </Link>
            )}
            {collapsed && (
              <Link to="/admin" className="mx-auto">
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
              {navSections.map((section, index) => (
                <div key={section.title}>
                  {!collapsed && (
                    <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} showText={!collapsed} />
                  ))}
                  {index < navSections.length - 1 && <div className="my-4 mx-2 border-t border-sidebar-border" />}
                </div>
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

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Admin Portal</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-koldify text-white text-xs font-bold">
                      {(user?.name?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase()}
                    </div>
                    {user && (
                      <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                        {user.name || user.email}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name || user?.email}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto bg-grid-pattern">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}
