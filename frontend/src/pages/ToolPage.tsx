import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, ChevronRight, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { cn, autoDetectColumns } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { getToolById } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

type Step = 'upload' | 'map' | 'configure' | 'run';

export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createRun } = useApp();

  const tool = getToolById(toolId || '');
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith('.csv')) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const h = lines[0].split(',').map(c => c.trim().replace(/"/g, ''));
      const r = lines.slice(1, 21).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return h.reduce((acc, header, i) => ({ ...acc, [header]: values[i] || '' }), {});
      });
      setHeaders(h);
      setRows(r);
      const detected = autoDetectColumns(h, r);
      const initialMapping: Record<string, string> = {};
      Object.entries(detected).forEach(([col, { field }]) => {
        initialMapping[col] = field;
      });
      setMapping(initialMapping);
      setStep('map');
    };
    reader.readAsText(f);
  };

  const handleRun = () => {
    if (!file || !tool) return;
    setIsRunning(true);
    setTimeout(() => {
      const run = createRun(tool.id, file.name, { mapping });
      toast({ title: 'Run started', description: `Processing ${file.name}` });
      navigate(`/runs/${run.id}`);
    }, 1000);
  };

  if (!tool) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Tool not found</h2>
        <Button variant="link" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'map', label: 'Map Columns' },
    { key: 'configure', label: 'Configure' },
    { key: 'run', label: 'Run' },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Play className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{tool.name}</h1>
              <Badge variant="outline">{tool.provider}</Badge>
            </div>
            <p className="text-muted-foreground">{tool.description}</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                i <= stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('ml-2 text-sm hidden sm:inline', i <= stepIndex ? 'font-medium' : 'text-muted-foreground')}>
                {s.label}
              </span>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'upload' && (
          <Card>
            <CardContent className="p-6">
              <div
                className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Drop your CSV file here</h3>
                <p className="text-muted-foreground mt-1">or click to browse</p>
                <input id="file-input" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'map' && (
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
              <CardDescription>Map your CSV columns to the required fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>{headers.map(h => <TableCell key={h} className="truncate max-w-32">{row[h]}</TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <div className="grid gap-4 sm:grid-cols-2">
                {headers.map(header => (
                  <div key={header} className="flex items-center gap-3">
                    <Label className="w-32 truncate shrink-0">{header}</Label>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select value={mapping[header] || ''} onValueChange={(v) => setMapping(prev => ({ ...prev, [header]: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="linkedin_url">LinkedIn URL</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="domain">Domain</SelectItem>
                        <SelectItem value="ignore">Ignore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
                <Button onClick={() => setStep('configure')}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'configure' && (
          <Card>
            <CardHeader>
              <CardTitle>Configure Run</CardTitle>
              <CardDescription>Review settings before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">File:</span><span className="font-medium">{file?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rows:</span><span className="font-medium">{rows.length}+</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mode:</span><span className="font-medium">Standard</span></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
                <Button className="gradient-koldify text-white" onClick={handleRun} disabled={isRunning}>
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Run
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
