import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FolderOutput,
  Pin,
  PinOff,
  Activity,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { mockTools } from '@/lib/mockData';
import { useBatches, useCredits } from '@/hooks/useApi';
import type { BatchItem } from '@/lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

function batchStatusLabel(status: string): string {
  const map: Record<string, string> = {
    QUEUED: 'Pending', RUNNING: 'Running', COMPLETED: 'Completed',
    FAILED: 'Failed', PARTIAL: 'Partial',
  };
  return map[status] ?? status;
}

function batchStatusKey(status: string): 'running' | 'paused' | 'completed' | 'failed' | 'pending' | 'cancelled' {
  const map: Record<string, 'running' | 'completed' | 'failed' | 'pending'> = {
    QUEUED: 'pending', RUNNING: 'running', COMPLETED: 'completed',
    FAILED: 'failed', PARTIAL: 'failed',
  };
  return map[status] ?? 'pending';
}

function BatchRunCard({ batch }: { batch: BatchItem }) {
  const navigate = useNavigate();
  const statusKey = batchStatusKey(batch.status);

  const statusConfig = {
    running: { icon: Play, color: 'text-primary', bg: 'bg-primary/10', label: 'Running' },
    paused: { icon: Pause, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Paused' },
    completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
    cancelled: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Cancelled' },
  };

  const config = statusConfig[statusKey];
  const StatusIcon = config.icon;
  const processedRows = batch.completedRows + batch.failedRows;
  const progress = batch.totalRows > 0 ? Math.round((processedRows / batch.totalRows) * 100) : 0;

  return (
    <Card 
      className="group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-300"
      onClick={() => navigate(`/runs/${batch.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.bg)}>
              <StatusIcon className={cn('h-5 w-5', config.color)} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows'}</p>
              <p className="text-sm text-muted-foreground truncate">{batch.originalFileName ?? 'Batch'}</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn('shrink-0 text-[11px]', config.color)}>
            {config.label}
          </Badge>
        </div>

        {(statusKey === 'running' || statusKey === 'pending') && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {processedRows.toLocaleString()} / {batch.totalRows.toLocaleString()} rows
              </span>
              <span className="font-medium text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
}) {
  return (
    <Card className="group hover:border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
            {trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span className={cn(
              'text-xs font-semibold',
              trend >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-xs text-muted-foreground">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, preferences, togglePinnedTool } = useApp();
  const { data: batches = [], isLoading } = useBatches();
  const { data: credits } = useCredits();

  const activeRuns = batches.filter(b => b.status === 'RUNNING' || b.status === 'QUEUED');
  const recentBatches = batches.slice(0, 5);
  const pinnedTools = mockTools.filter(t => preferences.pinnedTools.includes(t.id));

  const completedCount = batches.filter(b => b.status === 'COMPLETED').length;
  const failedCount = batches.filter(b => b.status === 'FAILED').length;
  const successRate = completedCount + failedCount > 0
    ? Math.round((completedCount / (completedCount + failedCount)) * 100)
    : 100;
  const today = new Date().toDateString();
  const totalToday = batches.filter(b => new Date(b.createdAt).toDateString() === today).length;

  const quickActions = [
    { title: 'New Run', icon: Play, href: '/runs', primary: true },
    { title: 'View Outputs', icon: FolderOutput, href: '/files' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening with your runs</p>
        </div>
        <Button 
          onClick={() => navigate('/runs')}
          className="gradient-koldify text-white hover:opacity-90 shadow-glow-sm"
        >
          <Play className="h-4 w-4 mr-2" />
          Start New Run
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { title: 'Credits', value: credits !== undefined ? credits.toLocaleString() : '...', subtitle: 'Available balance', icon: Coins },
          { title: 'Active Runs', value: activeRuns.length, subtitle: 'Currently processing', icon: Activity },
          { title: 'Success Rate', value: `${successRate}%`, subtitle: 'All time', icon: TrendingUp },
          { title: 'Total Runs', value: batches.length, subtitle: 'All batches', icon: Clock },
          { title: 'Total Today', value: totalToday, subtitle: 'Runs started', icon: Zap },
        ].map((stat, i) => (
          <motion.div key={stat.title} variants={fadeUp} initial="hidden" animate="visible" custom={0.1 + i * 0.08}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.45} className="grid gap-6 lg:grid-cols-3">
        {/* Active & Recent Runs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Runs */}
          {activeRuns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Continue Running</h2>
                <Link 
                  to="/runs" 
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeRuns.slice(0, 4).map(batch => (
                  <BatchRunCard key={batch.id} batch={batch} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Runs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Recent Runs</h2>
              <Link 
                to="/runs" 
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentBatches.map(batch => {
                    const statusKey = batchStatusKey(batch.status);
                    const statusConfig = {
                      running: { color: 'text-primary' },
                      paused: { color: 'text-blue-500' },
                      completed: { color: 'text-success' },
                      failed: { color: 'text-destructive' },
                      pending: { color: 'text-muted-foreground' },
                      cancelled: { color: 'text-muted-foreground' },
                    };
                    const processed = batch.completedRows + batch.failedRows;
                    
                    return (
                      <Link
                        key={batch.id}
                        to={`/runs/${batch.id}`}
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{batch.originalFileName ?? 'Batch'}</p>
                            <p className="text-xs text-muted-foreground truncate">{batch.sourceType === 'CSV_UPLOAD' ? 'CSV Upload' : 'Pasted Rows'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {processed.toLocaleString()} / {batch.totalRows.toLocaleString()} rows
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn('text-[11px]', statusConfig[statusKey].color)}
                          >
                            {batchStatusLabel(batch.status)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map(action => (
                <Button
                  key={action.title}
                  variant={action.primary ? 'default' : 'outline'}
                  className={cn(
                    'h-auto py-4 flex-col gap-2 rounded-xl',
                    action.primary && 'gradient-koldify text-white hover:opacity-90 shadow-glow-sm'
                  )}
                  onClick={() => navigate(action.href)}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{action.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Pinned Tools */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Pinned Tools</h2>
              <Pin className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {pinnedTools.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Pin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No pinned tools yet</p>
                    <p className="text-xs mt-1">Pin your favorite tools for quick access</p>
                  </CardContent>
                </Card>
              ) : (
                pinnedTools.map(tool => (
                  <Card 
                    key={tool.id}
                    className="cursor-pointer hover:border-primary/30 transition-all duration-200"
                    onClick={() => navigate(`/tools/${tool.id}`)}
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{tool.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{tool.description}</p>
                        </div>
                        <button
                          className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Unpin tool"
                          onClick={(e) => { e.stopPropagation(); togglePinnedTool(tool.id); }}
                        >
                          <PinOff className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
