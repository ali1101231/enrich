import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  Square,
  Activity,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAdminAllBatches } from '@/hooks/useApi';
import type { AdminBatchItem } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

type UIStatus = 'running' | 'paused' | 'completed' | 'failed' | 'pending' | 'cancelled';

const statusConfig: Record<UIStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  running: { icon: Play, color: 'text-primary', bg: 'bg-primary/10', label: 'Running' },
  paused: { icon: Pause, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Paused' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  cancelled: { icon: Square, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Cancelled' },
};

function toUIStatus(s: string): UIStatus {
  const map: Record<string, UIStatus> = {
    QUEUED: 'pending', RUNNING: 'running', COMPLETED: 'completed',
    FAILED: 'failed', PARTIAL: 'failed',
  };
  return map[s] ?? 'pending';
}

function AdminBatchRow({ batch, onClick }: { batch: AdminBatchItem; onClick: () => void }) {
  const uiStatus = toUIStatus(batch.status);
  const config = statusConfig[uiStatus];
  const StatusIcon = config.icon;
  const processed = batch.completedRows + batch.failedRows;
  const progress = batch.totalRows > 0 ? Math.round((processed / batch.totalRows) * 100) : 0;
  const label = batch.originalFileName ?? (batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows');
  const userName = batch.userDisplayName ?? batch.userEmail;

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0"
      onClick={onClick}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', config.bg)}>
        <StatusIcon className={cn('h-5 w-5', config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{label}</p>
          {batch.toolId && (
            <Badge variant="outline" className="text-[10px]">{batch.toolId}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{userName}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 shrink-0">
        {(uiStatus === 'running' || uiStatus === 'pending') && (
          <div className="w-32">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <div className="text-right">
          <p className="text-sm font-medium">
            {processed.toLocaleString()} / {batch.totalRows.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground">rows</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
          </p>
        </div>

        <Badge variant="secondary" className={cn('text-[11px]', config.color)}>
          {config.label}
        </Badge>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
  );
}

export default function AdminActivity() {
  const navigate = useNavigate();
  const { data: batches = [], isLoading } = useAdminAllBatches();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const queueBatches = batches.filter(b => ['QUEUED', 'RUNNING'].includes(b.status));
  const historyBatches = batches.filter(b => ['COMPLETED', 'FAILED', 'PARTIAL'].includes(b.status));

  const filterBatches = (list: AdminBatchItem[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(b =>
      (b.originalFileName ?? '').toLowerCase().includes(query) ||
      b.userEmail.toLowerCase().includes(query) ||
      (b.userDisplayName ?? '').toLowerCase().includes(query) ||
      b.sourceType.toLowerCase().includes(query) ||
      (b.toolId ?? '').toLowerCase().includes(query)
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground text-sm">Monitor all user runs across the platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by user, file name, tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="gap-2 text-sm">
            All
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {batches.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2 text-sm">
            Active
            {queueBatches.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {queueBatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-16 text-center">
                  <Activity className="h-7 w-7 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading activity...</p>
                </div>
              ) : filterBatches(batches).length === 0 ? (
                <div className="p-16 text-center">
                  <Activity className="h-7 w-7 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold text-base">No activity found</h3>
                  <p className="text-muted-foreground text-sm mt-1">No batches have been submitted yet</p>
                </div>
              ) : (
                filterBatches(batches).map(batch => (
                  <AdminBatchRow
                    key={batch.id}
                    batch={batch}
                    onClick={() => navigate(`/admin/activity/${batch.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filterBatches(queueBatches).length === 0 ? (
                <div className="p-16 text-center">
                  <Clock className="h-7 w-7 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold text-base">No active runs</h3>
                  <p className="text-muted-foreground text-sm mt-1">No batches are currently running</p>
                </div>
              ) : (
                filterBatches(queueBatches).map(batch => (
                  <AdminBatchRow
                    key={batch.id}
                    batch={batch}
                    onClick={() => navigate(`/admin/activity/${batch.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filterBatches(historyBatches).length === 0 ? (
                <div className="p-16 text-center">
                  <Activity className="h-7 w-7 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold text-base">No run history</h3>
                  <p className="text-muted-foreground text-sm mt-1">Completed runs will appear here</p>
                </div>
              ) : (
                filterBatches(historyBatches).map(batch => (
                  <AdminBatchRow
                    key={batch.id}
                    batch={batch}
                    onClick={() => navigate(`/admin/activity/${batch.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
