import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUserExports, useExportCsv } from '@/hooks/useApi';
import { batchApi } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function FilesPage() {
  const navigate = useNavigate();
  const { data: exports = [] } = useUserExports();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = exports.filter(exp =>
    exp.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground text-sm">Download and manage your output files</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}>
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                <FileText className="h-7 w-7 text-primary/50" />
              </div>
              <h3 className="font-semibold text-base">No files found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {exports.length === 0
                  ? "Complete a run to see output files here"
                  : "Try adjusting your search"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((exp, i) => {
                const token = localStorage.getItem("koldify-token");
                const downloadUrl = `${batchApi.downloadExportUrl(exp.id)}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/runs/${exp.batchId}`)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {exp.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exp.rowCount.toLocaleString()} rows • {formatDistanceToNow(new Date(exp.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <a
                      href={downloadUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <Badge variant="secondary" className="text-[11px] text-success">
                      Ready
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
