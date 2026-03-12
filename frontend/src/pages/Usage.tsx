import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { BarChart3, Coins, Database, Rows3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useUsageSummary } from '@/hooks/useApi';
import { useApp } from '@/contexts/AppContext';

function formatToolName(value: string): string {
  if (!value) return 'Unspecified Tool';
  return value;
}

export default function Usage() {
  const { user } = useApp();
  const { data, isLoading } = useUsageSummary(user?.id);
  const scopedData = data && user && data.user.id === user.id ? data : null;

  const topTools = useMemo(() => (scopedData?.toolUsage ?? []).slice(0, 8), [scopedData?.toolUsage]);

  const dailyUsage = useMemo(
    () =>
      (scopedData?.dailyUsage ?? []).map((item) => ({
        ...item,
        label: format(parseISO(item.date), 'MMM d'),
      })),
    [scopedData?.dailyUsage],
  );

  const chartConfig = {
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
          <span>Loading usage analytics...</span>
        </div>
      </div>
    );
  }

  if (!scopedData) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Usage</h1>
        <p className="text-muted-foreground mt-2">Usage data is not available for your account right now.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track your credits, rows processed, and tool-level usage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{scopedData.user.credits.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{scopedData.totals.creditsUsed.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rows Processed</CardTitle>
            <Rows3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{scopedData.totals.totalRows.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{scopedData.totals.totalBatches.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credits Used (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
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
        <CardHeader>
          <CardTitle className="text-base">Tool Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scopedData.toolUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No usage recorded yet.</p>
            ) : (
              scopedData.toolUsage.map((tool) => (
                <div key={tool.toolId} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{formatToolName(tool.toolName)}</p>
                    <p className="text-xs text-muted-foreground truncate">{tool.toolId}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">{tool.totalBatches.toLocaleString()} batches</Badge>
                    <Badge variant="outline">{tool.totalRows.toLocaleString()} rows</Badge>
                    <Badge>{tool.creditsUsed.toLocaleString()} credits</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
