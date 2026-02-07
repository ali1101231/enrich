import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/contexts/AppContext';
import { Run, RunStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<RunStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  running: { icon: Play, color: 'text-primary', bg: 'bg-primary/10', label: 'Running' },
  paused: { icon: Pause, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Paused' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  cancelled: { icon: Square, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Cancelled' },
};

function RunRow({ run, onClick }: { run: Run; onClick: () => void }) {
  const { pauseRun, resumeRun, stopRun, retryRun } = useApp();
  const config = statusConfig[run.status];
  const StatusIcon = config.icon;

  return (
    <div
      className="group flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0"
      onClick={onClick}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', config.bg)}>
        <StatusIcon className={cn('h-5 w-5', config.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{run.toolName}</p>
          <Badge variant="outline" className="shrink-0">{run.toolProvider}</Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{run.inputFileName}</p>
      </div>

      <div className="hidden md:flex items-center gap-6 shrink-0">
        {(run.status === 'running' || run.status === 'paused') && (
          <div className="w-32">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{run.progress}%</span>
              <span>{run.eta}</span>
            </div>
            <Progress value={run.progress} className="h-1.5" />
          </div>
        )}
        
        <div className="text-right">
          <p className="text-sm font-medium">
            {run.rowsProcessed.toLocaleString()} / {run.totalRows.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">rows</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
          </p>
        </div>

        <Badge variant="secondary" className={config.color}>
          {config.label}
        </Badge>
      </div>

      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        {run.status === 'running' && (
          <Button size="icon" variant="ghost" onClick={() => pauseRun(run.id)}>
            <Pause className="h-4 w-4" />
          </Button>
        )}
        {run.status === 'paused' && (
          <Button size="icon" variant="ghost" onClick={() => resumeRun(run.id)}>
            <Play className="h-4 w-4" />
          </Button>
        )}
        {(run.status === 'running' || run.status === 'paused') && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Square className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Stop this run?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel the run. Partial results may be available for download.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => stopRun(run.id)}>Stop Run</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {(run.status === 'failed' || run.status === 'cancelled') && (
          <Button size="icon" variant="ghost" onClick={() => retryRun(run.id)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function RunsPage() {
  const navigate = useNavigate();
  const { runs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('queue');

  const queueRuns = runs.filter(r => ['running', 'paused', 'pending'].includes(r.status));
  const historyRuns = runs.filter(r => ['completed', 'failed', 'cancelled'].includes(r.status));

  const filterRuns = (runList: Run[]) => {
    if (!searchQuery) return runList;
    const query = searchQuery.toLowerCase();
    return runList.filter(r => 
      r.toolName.toLowerCase().includes(query) ||
      r.inputFileName.toLowerCase().includes(query)
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Runs</h1>
          <p className="text-muted-foreground">Monitor and manage your job runs</p>
        </div>
        <Button
          onClick={() => navigate('/apify/post-finder')}
          className="gradient-koldify text-white hover:opacity-90"
        >
          <Play className="h-4 w-4 mr-2" />
          New Run
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search runs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue" className="gap-2">
            Queue
            {queueRuns.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {queueRuns.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filterRuns(queueRuns).length === 0 ? (
                <div className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg">No active runs</h3>
                  <p className="text-muted-foreground mt-1">Start a new run to see it here</p>
                  <Button
                    className="mt-4 gradient-koldify text-white"
                    onClick={() => navigate('/apify/post-finder')}
                  >
                    Start First Run
                  </Button>
                </div>
              ) : (
                filterRuns(queueRuns).map(run => (
                  <RunRow
                    key={run.id}
                    run={run}
                    onClick={() => navigate(`/runs/${run.id}`)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filterRuns(historyRuns).length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg">No run history</h3>
                  <p className="text-muted-foreground mt-1">Completed runs will appear here</p>
                </div>
              ) : (
                filterRuns(historyRuns).map(run => (
                  <RunRow
                    key={run.id}
                    run={run}
                    onClick={() => navigate(`/runs/${run.id}`)}
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
