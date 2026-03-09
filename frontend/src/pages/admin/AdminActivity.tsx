import { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Download,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';
import { formatDistanceToNow, format } from 'date-fns';

const actionIcons = {
  run_started: PlayCircle,
  run_completed: CheckCircle2,
  run_failed: XCircle,
  login: LogIn,
  file_download: Download,
};

const actionColors = {
  run_started: 'text-primary',
  run_completed: 'text-success',
  run_failed: 'text-destructive',
  login: 'text-muted-foreground',
  file_download: 'text-muted-foreground',
};

const actionLabels = {
  run_started: 'Started run',
  run_completed: 'Completed run',
  run_failed: 'Failed run',
  login: 'Logged in',
  file_download: 'Downloaded file',
};

export default function AdminActivity() {
  const { activity, users } = useAdmin();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const filteredActivity = activity.filter((act) => {
    const matchesSearch =
      act.userName.toLowerCase().includes(search.toLowerCase()) ||
      act.details.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || act.action === actionFilter;
    const matchesUser = userFilter === 'all' || act.userId === userFilter;
    return matchesSearch && matchesAction && matchesUser;
  });

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">Monitor all user actions and tool runs</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="run_started">Run Started</SelectItem>
            <SelectItem value="run_completed">Run Completed</SelectItem>
            <SelectItem value="run_failed">Run Failed</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="file_download">File Download</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredActivity.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No activity found matching your filters
              </div>
            ) : (
              filteredActivity.map((act) => {
                const Icon = actionIcons[act.action];
                return (
                  <div key={act.id} className="flex items-center gap-4 p-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full bg-muted',
                        actionColors[act.action]
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{act.userName}</p>
                        <Badge variant="outline" className="text-xs">
                          {actionLabels[act.action]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{act.details}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {act.creditsUsed > 0 && (
                        <p className="text-sm font-medium text-primary">
                          -{act.creditsUsed.toLocaleString()} credits
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
