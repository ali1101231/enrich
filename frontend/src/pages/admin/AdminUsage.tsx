import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, Users, Coins, Rows3, Database, Activity, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { useAdminUsageSummary } from '@/hooks/useApi';

export default function AdminUsage() {
  const { data, isLoading } = useAdminUsageSummary();
  const [search, setSearch] = useState('');

  const dailyUsage = useMemo(
    () =>
      (data?.dailyUsage ?? []).map((item) => ({
        ...item,
        label: format(parseISO(item.date), 'MMM d'),
      })),
    [data?.dailyUsage],
  );

  const topTools = useMemo(() => (data?.topTools ?? []).slice(0, 8), [data?.topTools]);

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data.users;

    return data.users.filter((user) => {
      const topToolsText = user.toolUsage
        .map((tool) => tool.toolName.toLowerCase())
        .join(' ');
      return (
        user.email.toLowerCase().includes(query) ||
        (user.displayName ?? '').toLowerCase().includes(query) ||
        topToolsText.includes(query)
      );
    });
  }, [data?.users, search]);

  const usageChartConfig = {
    creditsUsed: {
      label: 'Credits Used',
      color: 'hsl(var(--primary))',
    },
    rowsProcessed: {
      label: 'Rows Processed',
      color: 'hsl(var(--koldify-amber))',
    },
  };

  const toolsChartConfig = {
    creditsUsed: {
      label: 'Credits Used',
      color: 'hsl(var(--primary))',
    },
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Activity className="h-5 w-5 animate-spin" />
          <span>Loading platform usage...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Usage Analytics</h1>
        <p className="text-muted-foreground mt-2">Usage data is not available right now.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Usage Analytics</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          See total user credits and per-tool usage across all users.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totals.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {data.totals.activeUsers.toLocaleString()} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totals.currentCredits.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totals.creditsUsed.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rows Processed</CardTitle>
            <Rows3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totals.totalRows.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {data.totals.totalBatches.toLocaleString()} batches
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Usage (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={usageChartConfig} className="h-[280px] w-full">
              <LineChart data={dailyUsage}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="creditsUsed"
                  stroke="var(--color-creditsUsed)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Tools by Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={toolsChartConfig} className="h-[280px] w-full">
              <BarChart data={topTools}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="toolName"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                  tickFormatter={(value: string) => value.slice(0, 14)}
                />
                <YAxis tickLine={false} axisLine={false} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="creditsUsed" fill="var(--color-creditsUsed)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">All User Usage</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users or tools"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Current Credits</TableHead>
                <TableHead className="text-right">Credits Used</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Batches</TableHead>
                <TableHead>Tool Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const topUserTools = user.toolUsage.slice(0, 3);
                  return (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.displayName ?? user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'secondary' : 'destructive'}>
                          {user.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {user.credits.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {user.creditsUsed.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{user.totalRows.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{user.totalBatches.toLocaleString()}</TableCell>
                      <TableCell>
                        {topUserTools.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No usage</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {topUserTools.map((tool) => (
                              <Badge key={`${user.userId}-${tool.toolId}`} variant="outline" className="text-[10px]">
                                {tool.toolName}: {tool.creditsUsed.toLocaleString()}
                              </Badge>
                            ))}
                            {user.toolUsage.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">+{user.toolUsage.length - 3} more</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
