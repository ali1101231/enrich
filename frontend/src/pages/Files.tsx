import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileText, Filter, Trash2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { format, formatDistanceToNow } from 'date-fns';

export default function FilesPage() {
  const navigate = useNavigate();
  const { files, downloadFile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTool, setFilterTool] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const uniqueTools = [...new Set(files.map(f => f.toolName))];

  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.toolName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTool = filterTool === 'all' || file.toolName === filterTool;
    return matchesSearch && matchesTool;
  });

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id));
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground text-sm">Download and manage your output files</p>
        </div>
        {selectedFiles.length > 0 && (
          <Button className="gradient-koldify text-white shadow-glow-sm">
            <Download className="h-4 w-4 mr-2" />
            Download Selected ({selectedFiles.length})
          </Button>
        )}
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
        <Select value={filterTool} onValueChange={setFilterTool}>
          <SelectTrigger className="w-full sm:w-48 h-9">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Filter by tool" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tools</SelectItem>
            {uniqueTools.map(tool => (
              <SelectItem key={tool} value={tool}>{tool}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredFiles.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                <FileText className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-base">No files found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {files.length === 0 
                  ? "Complete a run to see output files here"
                  : "Try adjusting your search or filters"
                }
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/30">
                <Checkbox
                  checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
                <div className="flex-1 grid grid-cols-12 gap-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  <span className="col-span-5">File Name</span>
                  <span className="col-span-3 hidden md:block">Tool</span>
                  <span className="col-span-2 hidden sm:block">Size</span>
                  <span className="col-span-2 hidden lg:block">Created</span>
                </div>
                <div className="w-24" />
              </div>

              {/* Files */}
              <div className="divide-y">
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group"
                  >
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                    />
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center min-w-0">
                      <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{file.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {formatFileSize(file.size)} • {file.toolName}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3 hidden md:block">
                        <Badge variant="outline" className="text-[10px]">{file.toolName}</Badge>
                      </div>
                      <div className="col-span-2 hidden sm:block text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="col-span-2 hidden lg:block text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 w-24 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => navigate(`/runs/${file.runId}`)}
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => downloadFile(file.id)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
