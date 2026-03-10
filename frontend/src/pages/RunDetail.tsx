import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Activity,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBatchDetail, useBatchProgress, useBatchJobs, useBatchExports, useExportCsv, useBatchResultCounts } from '@/hooks/useApi';
import { batchApi } from '@/lib/api';
import { format } from 'date-fns';

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

export default function RunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: batch, isLoading: batchLoading } = useBatchDetail(id!);
  const { data: progress } = useBatchProgress(id!);
  const { data: jobsData } = useBatchJobs(id!);
  const { data: exports = [] } = useBatchExports(id!);
  const { data: resultCounts } = useBatchResultCounts(id!);
  const exportMutation = useExportCsv();

  if (batchLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Activity className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Run not found</h2>
        <Button variant="link" onClick={() => navigate('/runs')}>
          Go back to runs
        </Button>
      </div>
    );
  }

  const uiStatus = toUIStatus(batch.status);
  const config = statusConfig[uiStatus];
  const StatusIcon = config.icon;
  const processed = batch.completedRows + batch.failedRows;
  const percent = progress?.percentageComplete ?? (batch.totalRows > 0 ? Math.round((processed / batch.totalRows) * 100) : 0);
  const jobs = jobsData?.items ?? [];
  const label = batch.originalFileName ?? (batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows');

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
            <h1 className="text-2xl font-bold">{label}</h1>
            <Badge variant="secondary" className={config.color}>
              {config.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows'}</p>
        </div>
      </div>

      {/* Progress Section */}
      {(uiStatus === 'running' || uiStatus === 'pending') && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold">{uiStatus === 'running' ? 'Processing' : 'Queued'}</p>
                <p className="text-sm text-muted-foreground">
                  {processed.toLocaleString()} of {batch.totalRows.toLocaleString()} rows processed
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{percent}%</p>
                {progress?.estimatedRemainingSeconds != null && progress.estimatedRemainingSeconds > 0 && (
                  <p className="text-sm text-muted-foreground">~{Math.ceil(progress.estimatedRemainingSeconds / 60)}m remaining</p>
                )}
              </div>
            </div>
            <Progress value={percent} className="h-3" />
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
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{batch.totalRows.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{batch.completedRows.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold text-primary">{batch.runningRows.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">{batch.failedRows.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jobs ({jobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-1">
                      {jobs.map(job => (
                        <div key={job.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/40 text-sm">
                          <span className="font-mono text-muted-foreground">Chunk #{job.sequence}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{job.rowCount} rows</span>
                            <Badge variant="secondary" className={cn('text-[11px]', statusConfig[toUIStatus(job.status)].color)}>
                              {toUIStatus(job.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {jobs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No jobs yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="failed" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-1">
                      {jobs.filter(j => j.status === 'FAILED').map(job => (
                        <div key={job.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/40 text-sm">
                          <span className="font-mono text-muted-foreground">Chunk #{job.sequence}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{job.rowCount} rows</span>
                            <span className="text-muted-foreground">Attempts: {job.attempts}</span>
                            <Badge variant="secondary" className="text-[11px] text-destructive">failed</Badge>
                          </div>
                        </div>
                      ))}
                      {jobs.filter(j => j.status === 'FAILED').length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No failed jobs</p>
                      )}
                    </div>
                  </ScrollArea>
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
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(batch.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIcon className={cn('h-4 w-4', config.color)} />
                  <p className="font-medium">{config.label}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium">{batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Outputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outputs</CardTitle>
            </CardHeader>
            <CardContent>
              {(uiStatus === 'completed' || uiStatus === 'failed') ? (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    disabled={exportMutation.isPending}
                    onClick={() => exportMutation.mutate(id!)}
                  >
                    {exportMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {exportMutation.isPending ? 'Exporting...' : 'Export Results CSV'}
                  </Button>
                  {resultCounts && (
                    <p className="text-xs text-muted-foreground text-center">
                      {resultCounts.success.toLocaleString()} succeeded, {resultCounts.failure.toLocaleString()} failed
                    </p>
                  )}
                  {exports.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {exports.map(exp => {
                        const token = localStorage.getItem("koldify-token");
                        const downloadUrl = `${batchApi.downloadExportUrl(exp.id)}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                        return (
                          <a
                            key={exp.id}
                            href={downloadUrl}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/40 text-sm"
                          >
                            <span className="truncate">{exp.fileName}</span>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {exp.rowCount} rows
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
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
