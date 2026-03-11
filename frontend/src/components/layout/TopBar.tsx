import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  Coins,
  Pin,
  PinOff,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useCredits } from '@/hooks/useApi';
import { mockTools } from '@/lib/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TopBar() {
  const navigate = useNavigate();
  const { 
    user, 
    preferences,
    logout, 
    updatePreferences,
    togglePinnedTool,
  } = useApp();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: credits } = useCredits();

  const isDark = preferences.theme === 'dark';

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const filteredTools = mockTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToolSelect = (toolId: string) => {
    const tool = mockTools.find(t => t.id === toolId);
    if (tool) {
      navigate(`/tools/${tool.id}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Search Trigger */}
          <Button
            variant="outline"
            className="hidden h-10 w-72 items-center gap-2 rounded-xl border-border/70 bg-card/70 text-muted-foreground transition-all duration-200 hover:border-border hover:bg-card md:flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left text-sm">Search tools and routes...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded-md border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              Ctrl K
            </kbd>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-2xl border border-border/70 bg-card/80 p-1.5 shadow-sm lg:flex">
            <button
              onClick={() => navigate('/pricing')}
              className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-amber-600 transition-colors duration-200 hover:bg-amber-500/10 dark:text-amber-400"
            >
              <Coins className="h-4 w-4" />
              <span>{credits !== undefined ? credits.toLocaleString() : '...'} credits</span>
            </button>

            <div className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium text-success">
              <span className="h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_10px_hsl(var(--success)/0.55)]" />
              <span>Connected</span>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 rounded-xl px-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-koldify text-xs font-semibold text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[140px] truncate text-sm font-medium">{user?.name || user?.email}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.name || user?.email}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings/account')} className="rounded-lg">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/preferences')} className="rounded-lg">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme} className="rounded-lg">
                  {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg" onClick={() => navigate('/support')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="rounded-lg text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1.5 lg:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-koldify text-xs font-semibold text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.name || user?.email}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/pricing')} className="rounded-lg">
                  <Coins className="mr-2 h-4 w-4" />
                  Credits: {credits !== undefined ? credits.toLocaleString() : '...'}
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                  Connected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/account')} className="rounded-lg">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/preferences')} className="rounded-lg">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme} className="rounded-lg">
                  {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg" onClick={() => navigate('/support')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="rounded-lg text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Palette / Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg rounded-xl">
          <div className="flex items-center border-b px-4">
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
                {filteredTools.map(tool => (
                        <div
                          key={tool.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/80 text-left transition-colors cursor-pointer"
                          onClick={() => handleToolSelect(tool.id)}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Search className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{tool.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                          </div>
                          <button
                            className={cn(
                              'shrink-0 p-1 rounded hover:bg-muted transition-colors',
                              preferences.pinnedTools.includes(tool.id) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                            title={preferences.pinnedTools.includes(tool.id) ? 'Unpin tool' : 'Pin tool'}
                            onClick={(e) => { e.stopPropagation(); togglePinnedTool(tool.id); }}
                          >
                            {preferences.pinnedTools.includes(tool.id) ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
