import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  Coins,
  HelpCircle,
  Pin,
  PinOff,
  Search,
  Settings,
  Tag,
  User,
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
  Dialog,
  DialogContent,
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
    togglePinnedTool,
  } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: credits } = useCredits();

  const filteredTools = mockTools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToolSelect = (toolId: string) => {
    navigate(`/tools/${toolId}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 lg:px-4 lg:pt-4">
        <div className="flex h-[74px] items-center justify-between rounded-[24px] bg-transparent px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <Button
              variant="outline"
              className="hidden h-11 w-[300px] items-center gap-3 rounded-2xl border-border/75 bg-card px-4 text-muted-foreground hover:border-border hover:bg-card md:flex lg:w-[380px]"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left text-sm">Search tools, runs, and routes</span>
              <kbd className="pointer-events-none hidden h-7 select-none items-center gap-1 rounded-xl border border-border/75 bg-muted/70 px-2.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                Ctrl K
              </kbd>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-2xl border border-border/75 bg-card text-foreground/80 md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-1.5 rounded-[22px] border border-border/70 bg-card p-1.5 shadow-sm xl:flex">
              <button
                onClick={() => navigate('/pricing')}
                className="flex h-9 items-center gap-2 rounded-2xl px-3 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-black/5"
              >
                <Coins className="h-4 w-4" />
                <span>{credits !== undefined ? credits.toLocaleString() : '...'} credits</span>
              </button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-2xl text-muted-foreground transition-all duration-200 hover:bg-black/5 hover:text-primary"
                onClick={() => navigate('/offers')}
                aria-label="Offers"
                title="Offers"
              >
                <Tag className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-2xl text-muted-foreground transition-all duration-200 hover:bg-black/5 hover:text-foreground"
                onClick={() => navigate('/usage')}
                aria-label="Usage"
                title="Usage"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 rounded-2xl px-2.5 text-foreground hover:bg-black/5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed,#a78bfa)] text-xs font-semibold text-white shadow-[0_16px_28px_-20px_rgba(124,58,237,0.75)]">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <span className="max-w-[140px] truncate text-sm font-medium">{user?.name || user?.email}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-[24px] border border-border bg-popover text-popover-foreground">
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
                  <DropdownMenuItem onClick={() => navigate('/news')} className="rounded-lg">
                    <Search className="mr-2 h-4 w-4" />
                    News
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg" onClick={() => navigate('/support')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-1.5 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-2xl border border-border/75 bg-card text-foreground/80"
                onClick={() => navigate('/offers')}
                aria-label="Offers"
                title="Offers"
              >
                <Tag className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-border/75 bg-card">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed,#a78bfa)] text-xs font-semibold text-white">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-[24px] border border-border bg-popover text-popover-foreground">
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
                  <DropdownMenuItem onClick={() => navigate('/settings/account')} className="rounded-lg">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/preferences')} className="rounded-lg">
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/news')} className="rounded-lg">
                    <Search className="mr-2 h-4 w-4" />
                    News
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg" onClick={() => navigate('/support')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg gap-0 rounded-[28px] border border-border bg-popover/95 p-0 text-popover-foreground backdrop-blur">
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-14 border-0 bg-transparent text-popover-foreground focus-visible:ring-0"
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
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-black/5"
                    onClick={() => handleToolSelect(tool.id)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12">
                      <Search className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{tool.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                    <button
                      className={cn(
                        'shrink-0 rounded-xl p-1.5 transition-colors hover:bg-black/5',
                        preferences.pinnedTools.includes(tool.id) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      )}
                      title={preferences.pinnedTools.includes(tool.id) ? 'Unpin tool' : 'Pin tool'}
                      onClick={(event) => {
                        event.stopPropagation();
                        togglePinnedTool(tool.id);
                      }}
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