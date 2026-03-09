import {
  Users,
  Key,
  TrendingUp,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAdmin } from '@/contexts/AdminContext';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const { users, keys, activity, stats } = useAdmin();

  const creditUsagePercent = (stats.totalCreditsUsed / stats.totalCreditsAvailable) * 100;

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, keys, and monitor usage</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">{stats.activeUsers} active</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeKeys}</div>
            <p className="text-xs text-muted-foreground">
              {keys.length} total in pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalCreditsUsed / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">
              of {(stats.totalCreditsAvailable / 1000).toFixed(0)}K total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditUsagePercent.toFixed(1)}%</div>
            <Progress value={creditUsagePercent} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    act.action === 'run_completed' ? 'bg-success' :
                    act.action === 'run_failed' ? 'bg-destructive' :
                    act.action === 'run_started' ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{act.userName}</p>
                    <p className="text-xs text-muted-foreground">{act.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {act.creditsUsed > 0 && (
                      <p className="text-xs font-medium text-primary">
                        -{act.creditsUsed.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Users by Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Users by Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...users]
                .sort((a, b) => b.creditsUsed - a.creditsUsed)
                .slice(0, 5)
                .map((user) => {
                  const usagePercent = (user.creditsUsed / user.creditsTotal) * 100;
                  return (
                    <div key={user.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {(user.creditsUsed / 1000).toFixed(0)}K / {(user.creditsTotal / 1000).toFixed(0)}K
                          </p>
                          <p className={`text-xs flex items-center justify-end ${
                            usagePercent > 90 ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {usagePercent > 90 ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {usagePercent.toFixed(0)}% used
                          </p>
                        </div>
                      </div>
                      <Progress value={usagePercent} className="h-1.5" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
