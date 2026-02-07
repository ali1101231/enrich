import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  ArrowRight,
  Key,
  FolderOutput,
  Upload,
  Pin,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { mockTools } from '@/lib/mockData';
import { Run } from '@/types';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function RunCard({ run }: { run: Run }) {
  const navigate = useNavigate();
  const { pauseRun, resumeRun } = useApp();

  const statusConfig = {
    running: { icon: Play, color: 'text-primary', bg: 'bg-primary/10', label: 'Running' },
    paused: { icon: Pause, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Paused' },
    completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Completed' },
    failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
    pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
    cancelled: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Cancelled' },
  };

  const config = statusConfig[run.status];
  const StatusIcon = config.icon;

  return (
    <Card 
      className="group cursor-pointer hover:border-primary/50 transition-all duration-200"
      onClick={() => navigate(`/runs/${run.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.bg)}>
              <StatusIcon className={cn('h-5 w-5', config.color)} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{run.toolName}</p>
              <p className="text-sm text-muted-foreground truncate">{run.inputFileName}</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn('shrink-0', config.color)}>
            {config.label}
          </Badge>
        </div>

        {(run.status === 'running' || run.status === 'paused') && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {run.rowsProcessed.toLocaleString()} / {run.totalRows.toLocaleString()} rows
              </span>
              <span className="font-medium">{run.progress}%</span>
            </div>
            <Progress value={run.progress} className="h-2" />
            {run.eta && (
              <p className="text-xs text-muted-foreground">ETA: {run.eta}</p>
            )}
          </div>
        )}

        {run.status === 'running' && (
          <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => pauseRun(run.id)}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          </div>
        )}

        {run.status === 'paused' && (
          <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              className="flex-1 gradient-koldify text-white"
              onClick={() => resumeRun(run.id)}
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className={cn(
              'h-4 w-4',
              trend >= 0 ? 'text-success' : 'text-destructive'
            )} />
            <span className={cn(
              'text-sm font-medium',
              trend >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-sm text-muted-foreground">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, runs, stats, preferences, apifyKeys, blitzKeys } = useApp();
  
  const activeRuns = runs.filter(r => r.status === 'running' || r.status === 'paused');
  const recentRuns = runs.slice(0, 5);
  const pinnedTools = mockTools.filter(t => preferences.pinnedTools.includes(t.id));

  const quickActions = [
    { title: 'New Run', icon: Play, href: '/runs', primary: true },
    { title: 'Upload CSV', icon: Upload, href: '/csv/csv-splitter' },
    { title: 'Add Keys', icon: Key, href: '/settings/keys' },
    { title: 'View Outputs', icon: FolderOutput, href: '/files' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your runs</p>
        </div>
        <Button 
          onClick={() => navigate('/runs')}
          className="gradient-koldify text-white hover:opacity-90"
        >
          <Play className="h-4 w-4 mr-2" />
          Start New Run
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Runs"
          value={stats.activeRuns}
          subtitle="Currently processing"
          icon={Activity}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          subtitle="Last 7 days"
          icon={TrendingUp}
          trend={3.2}
        />
        <StatCard
          title="Avg Runtime"
          value={formatDuration(stats.avgRuntime)}
          subtitle="Per job"
          icon={Clock}
        />
        <StatCard
          title="Total Today"
          value={stats.totalRunsToday}
          subtitle="Runs completed"
          icon={Zap}
        />
      </div>

      {/* Keys Health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Keys Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
              <span className={cn(
                'status-dot',
                apifyKeys.filter(k => k.enabled && k.status === 'active').length > 0
                  ? 'status-online'
                  : 'status-error'
              )} />
              <div>
                <p className="font-medium">Apify Keys</p>
                <p className="text-sm text-muted-foreground">
                  {apifyKeys.filter(k => k.enabled && k.status === 'active').length} active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
              <span className={cn(
                'status-dot',
                blitzKeys.some(k => k.enabled && k.status === 'active')
                  ? 'status-online'
                  : 'status-error'
              )} />
              <div>
                <p className="font-medium">Blitz Key</p>
                <p className="text-sm text-muted-foreground">
                  {blitzKeys.some(k => k.enabled && k.status === 'active') ? 'Valid' : 'Not configured'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-primary"
              onClick={() => navigate('/settings/keys')}
            >
              Manage Keys
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active & Recent Runs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Runs */}
          {activeRuns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Continue Running</h2>
                <Link 
                  to="/runs" 
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeRuns.slice(0, 4).map(run => (
                  <RunCard key={run.id} run={run} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Runs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Runs</h2>
              <Link 
                to="/runs" 
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentRuns.map(run => {
                    const statusConfig = {
                      running: { color: 'text-primary' },
                      paused: { color: 'text-blue-500' },
                      completed: { color: 'text-success' },
                      failed: { color: 'text-destructive' },
                      pending: { color: 'text-muted-foreground' },
                      cancelled: { color: 'text-muted-foreground' },
                    };
                    
                    return (
                      <Link
                        key={run.id}
                        to={`/runs/${run.id}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{run.toolName}</p>
                            <p className="text-sm text-muted-foreground truncate">{run.inputFileName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground hidden sm:block">
                            {run.rowsProcessed.toLocaleString()} rows
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={statusConfig[run.status].color}
                          >
                            {run.status}
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
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => (
                <Button
                  key={action.title}
                  variant={action.primary ? 'default' : 'outline'}
                  className={cn(
                    'h-auto py-4 flex-col gap-2',
                    action.primary && 'gradient-koldify text-white hover:opacity-90'
                  )}
                  onClick={() => navigate(action.href)}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-sm">{action.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Pinned Tools */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pinned Tools</h2>
              <Pin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              {pinnedTools.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Pin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pinned tools yet</p>
                    <p className="text-xs mt-1">Pin your favorite tools for quick access</p>
                  </CardContent>
                </Card>
              ) : (
                pinnedTools.map(tool => (
                  <Card 
                    key={tool.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/${tool.provider}/${tool.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{tool.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {tool.provider}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
