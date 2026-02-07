import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  RotateCcw,
  Copy,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Activity,
  Zap,
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { mockRunDetails } from '@/lib/mockData';
import { formatDistanceToNow, format } from 'date-fns';

const statusConfig = {
  running: { icon: Play, color: 'text-primary', bg: 'bg-primary/10', label: 'Running' },
  paused: { icon: Pause, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Paused' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  cancelled: { icon: Square, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Cancelled' },
};

const stageConfig = {
  uploading: { label: 'Uploading', progress: 10 },
  preparing: { label: 'Preparing', progress: 25 },
  processing: { label: 'Processing', progress: 50 },
  writing: { label: 'Writing Output', progress: 90 },
  completed: { label: 'Completed', progress: 100 },
  failed: { label: 'Failed', progress: 0 },
};

export default function RunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { runs, pauseRun, resumeRun, stopRun, retryRun, downloadFile } = useApp();
  
  const run = runs.find(r => r.id === id);
  
  if (!run) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Run not found</h2>
        <Button variant="link" onClick={() => navigate('/runs')}>
          Go back to runs
        </Button>
      </div>
    );
  }

  // Use mock details for demo
  const details = { ...mockRunDetails, ...run };
  const config = statusConfig[run.status];
  const StatusIcon = config.icon;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/runs')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{run.toolName}</h1>
            <Badge variant="outline">{run.toolProvider}</Badge>
            <Badge variant="secondary" className={config.color}>
              {config.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{run.inputFileName}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {run.status === 'running' && (
            <Button variant="outline" onClick={() => pauseRun(run.id)}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {run.status === 'paused' && (
            <Button className="gradient-koldify text-white" onClick={() => resumeRun(run.id)}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {(run.status === 'running' || run.status === 'paused') && (
            <Button variant="destructive" onClick={() => stopRun(run.id)}>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          {(run.status === 'failed' || run.status === 'cancelled') && (
            <Button onClick={() => retryRun(run.id)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          <Button variant="outline" size="icon">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Section */}
      {(run.status === 'running' || run.status === 'paused') && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold">{stageConfig[run.stage].label}</p>
                <p className="text-sm text-muted-foreground">
                  {run.rowsProcessed.toLocaleString()} of {run.totalRows.toLocaleString()} rows processed
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{run.progress}%</p>
                {run.eta && <p className="text-sm text-muted-foreground">ETA: {run.eta}</p>}
              </div>
            </div>
            <Progress value={run.progress} className="h-3" />
            
            {/* Stage Timeline */}
            <div className="flex items-center justify-between mt-6 px-2">
              {['uploading', 'preparing', 'processing', 'writing', 'completed'].map((stage, idx) => {
                const stageProgress = stageConfig[stage as keyof typeof stageConfig].progress;
                const isComplete = run.progress >= stageProgress;
                const isCurrent = run.stage === stage;
                
                return (
                  <div key={stage} className="flex items-center">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                      isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      isCurrent && 'ring-2 ring-primary ring-offset-2'
                    )}>
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    {idx < 4 && (
                      <div className={cn(
                        'w-12 sm:w-20 h-0.5',
                        isComplete ? 'bg-primary' : 'bg-muted'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Upload</span>
              <span>Prepare</span>
              <span>Process</span>
              <span>Write</span>
              <span>Done</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold">{details.metrics.processed.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Found</p>
                <p className="text-2xl font-bold text-success">{details.metrics.found.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-warning">{details.metrics.skipped.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-destructive">{details.metrics.errors.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                  <TabsTrigger value="debug">Debug</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4 font-mono text-sm">
                    {details.logs.map(log => (
                      <div key={log.id} className="flex gap-3 py-1">
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </span>
                        <span className={cn(
                          'shrink-0 uppercase text-xs font-semibold w-12',
                          log.level === 'error' && 'text-destructive',
                          log.level === 'warn' && 'text-warning',
                          log.level === 'info' && 'text-muted-foreground',
                        )}>
                          {log.level}
                        </span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="errors" className="mt-4">
                  <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4 font-mono text-sm">
                    {details.logs.filter(l => l.level === 'error').map(log => (
                      <div key={log.id} className="flex gap-3 py-1">
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </span>
                        <span className="text-destructive">{log.message}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="debug" className="mt-4">
                  <div className="h-64 rounded-lg border bg-muted/30 p-4 flex items-center justify-center text-muted-foreground">
                    No debug logs
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Run Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-medium">{format(new Date(run.startedAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
              {run.completedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">{format(new Date(run.completedAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              )}
              {run.keyLabel && (
                <div>
                  <p className="text-sm text-muted-foreground">Key Used</p>
                  <p className="font-medium">{run.keyLabel}</p>
                </div>
              )}
              {run.error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  {run.error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Column Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(details.columnMapping).map(([source, target]) => (
                  <div key={source} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{source}</span>
                    <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{target}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Outputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              {run.status === 'completed' ? (
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => downloadFile('file-1')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Output CSV
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Outputs will be available when the run completes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
