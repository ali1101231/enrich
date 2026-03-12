import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Search,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useBatches } from '@/hooks/useApi';
import type { BatchItem } from '@/lib/api';
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

function BatchRow({ batch, onClick }: { batch: BatchItem; onClick: () => void }) {
  const uiStatus = toUIStatus(batch.status);
  const config = statusConfig[uiStatus];
  const StatusIcon = config.icon;
  const processed = batch.completedRows + batch.failedRows;
  const progress = batch.totalRows > 0 ? Math.round((processed / batch.totalRows) * 100) : 0;
  const label = batch.originalFileName ?? (batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows');

  return (
    <div
      className="group flex cursor-pointer items-center gap-4 border-b px-4 py-3.5 transition-colors hover:bg-muted/30 last:border-b-0"
      onClick={onClick}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl shrink-0', config.bg)}>
        <StatusIcon className={cn('h-5 w-5', config.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{label}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows'}</p>
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

        <Badge variant="secondary" className={cn('text-[11px] border-0', config.color)}>
          {config.label}
        </Badge>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </div>
  );
}

export default function RunsPage() {
  const navigate = useNavigate();
  const { data: batches = [] } = useBatches();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('queue');

  const queueBatches = batches.filter(b => ['QUEUED', 'RUNNING'].includes(b.status));
  const historyBatches = batches.filter(b => ['COMPLETED', 'FAILED', 'PARTIAL'].includes(b.status));

  const filterBatches = (list: BatchItem[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(b =>
      (b.originalFileName ?? '').toLowerCase().includes(query) ||
      b.sourceType.toLowerCase().includes(query)
    );
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Runs</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage your job runs</p>
        </div>
        <Button
          onClick={() => navigate('/tools/email-enricher')}
          className="h-11 rounded-2xl gradient-koldify text-white hover:opacity-90 shadow-glow-sm"
        >
          <Play className="h-4 w-4 mr-2" />
          New Run
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1} className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10">
          <TabsTrigger value="queue" className="gap-2 text-sm">
            Queue
            {queueBatches.length > 0 && (
              <Badge variant="secondary" className="h-5 border-0 px-1.5 text-[10px]">
                {queueBatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
          <Card className="overflow-hidden border-border/70">
            <CardContent className="p-0">
              {filterBatches(queueBatches).length === 0 ? (
                <div className="p-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <Clock className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-base">No active runs</h3>
                  <p className="text-muted-foreground text-sm mt-1">Start a new run to see it here</p>
                  <Button
                    className="mt-5 gradient-koldify text-white shadow-glow-sm"
                    onClick={() => navigate('/tools/email-enricher')}
                  >
                    Start First Run
                  </Button>
                </div>
              ) : (
                filterBatches(queueBatches).map(batch => (
                  <BatchRow
                    key={batch.id}
                    batch={batch}
                    onClick={() => navigate(`/runs/${batch.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="overflow-hidden border-border/70">
            <CardContent className="p-0">
              {filterBatches(historyBatches).length === 0 ? (
                <div className="p-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <FileText className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold text-base">No run history</h3>
                  <p className="text-muted-foreground text-sm mt-1">Completed runs will appear here</p>
                </div>
              ) : (
                filterBatches(historyBatches).map(batch => (
                  <BatchRow
                    key={batch.id}
                    batch={batch}
                    onClick={() => navigate(`/runs/${batch.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}
