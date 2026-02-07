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
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-muted-foreground">Download and manage your output files</p>
        </div>
        {selectedFiles.length > 0 && (
          <Button className="gradient-koldify text-white">
            <Download className="h-4 w-4 mr-2" />
            Download Selected ({selectedFiles.length})
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTool} onValueChange={setFilterTool}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
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
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">No files found</h3>
              <p className="text-muted-foreground mt-1">
                {files.length === 0 
                  ? "Complete a run to see output files here"
                  : "Try adjusting your search or filters"
                }
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 p-4 border-b bg-muted/50">
                <Checkbox
                  checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
                <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
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
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                    />
                    <div className="flex-1 grid grid-cols-12 gap-4 items-center min-w-0">
                      <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground sm:hidden">
                            {formatFileSize(file.size)} • {file.toolName}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-3 hidden md:block">
                        <Badge variant="outline">{file.toolName}</Badge>
                      </div>
                      <div className="col-span-2 hidden sm:block text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="col-span-2 hidden lg:block text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-24 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/runs/${file.runId}`)}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadFile(file.id)}
                      >
                        <Download className="h-4 w-4" />
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
