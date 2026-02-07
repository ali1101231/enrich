import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Plus,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  Wifi,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { mockTools } from '@/lib/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export function TopBar() {
  const navigate = useNavigate();
  const { 
    user, 
    notifications, 
    preferences,
    logout, 
    updatePreferences,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;
  const isDark = preferences.theme === 'dark';

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Set initial theme
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark);
  }

  const filteredTools = mockTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToolSelect = (toolId: string) => {
    const tool = mockTools.find(t => t.id === toolId);
    if (tool) {
      navigate(`/${tool.provider}/${tool.id}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Search Trigger */}
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 text-muted-foreground w-64"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">Search tools...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Server Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium">
            <span className="status-dot status-online" />
            <span>Connected</span>
          </div>

          {/* New Run Button */}
          <Button
            onClick={() => navigate('/runs')}
            className="hidden sm:flex gradient-koldify text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Run
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={markAllNotificationsRead}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        className={cn(
                          'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                          !notif.read && 'bg-primary/5'
                        )}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.runId) navigate(`/runs/${notif.runId}`);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                            notif.type === 'run-completed' && 'bg-success/10 text-success',
                            notif.type === 'run-failed' && 'bg-destructive/10 text-destructive',
                            notif.type === 'run-paused' && 'bg-blue-500/10 text-blue-500',
                            notif.type === 'key-warning' && 'bg-warning/10 text-warning',
                          )}>
                            {notif.type === 'run-completed' && <Check className="h-4 w-4" />}
                            {notif.type === 'run-failed' && <X className="h-4 w-4" />}
                            {notif.type === 'run-paused' && <Clock className="h-4 w-4" />}
                            {notif.type === 'key-warning' && <Bell className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notif.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden lg:block text-sm font-medium">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings/account')}>
                <User className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings/keys')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Palette / Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 h-12"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-80">
            {filteredTools.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">No tools found</p>
              </div>
            ) : (
              <div className="p-2">
                {['apify', 'blitz', 'csv'].map(provider => {
                  const providerTools = filteredTools.filter(t => t.provider === provider);
                  if (providerTools.length === 0) return null;
                  
                  return (
                    <div key={provider}>
                      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                        {provider} Tools
                      </p>
                      {providerTools.map(tool => (
                        <button
                          key={tool.id}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted text-left"
                          onClick={() => handleToolSelect(tool.id)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            <Search className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{tool.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {tool.provider}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
