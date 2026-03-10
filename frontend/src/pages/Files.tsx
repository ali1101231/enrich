import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBatches } from '@/hooks/useApi';
import type { BatchItem } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function FilesPage() {
  const navigate = useNavigate();
  const { data: batches = [] } = useBatches();
  const [searchQuery, setSearchQuery] = useState('');

  // Show completed batches as downloadable outputs
  const completedBatches = batches.filter(b => b.status === 'COMPLETED' || b.status === 'PARTIAL');
  const filtered = completedBatches.filter(b =>
    (b.originalFileName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground text-sm">Download and manage your output files</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                <FileText className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-base">No files found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {completedBatches.length === 0
                  ? "Complete a run to see output files here"
                  : "Try adjusting your search"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(batch => (
                <div
                  key={batch.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/runs/${batch.id}`)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {batch.originalFileName ?? 'Batch output'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {batch.completedRows.toLocaleString()} rows • {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[11px] text-success">
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
