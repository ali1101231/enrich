import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, ChevronRight, Play, CheckCircle2, Loader2, FileText, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { getToolById } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { batchApi, ApiError } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { ToolField } from '@/types';

type Step = 'input' | 'map' | 'configure' | 'run';
type InputMode = 'csv' | 'paste';

/** Derive placeholder text for bulk paste based on the tool's primary required field. */
function getPastePlaceholder(field: ToolField): string {
  switch (field.type) {
    case 'linkedin': return 'https://www.linkedin.com/in/john-doe\nhttps://www.linkedin.com/in/jane-smith\nhttps://www.linkedin.com/in/bob-jones';
    case 'email':    return 'john@example.com\njane@company.io\nbob@startup.co';
    case 'phone':    return '+14155551234\n+442071234567\n+33612345678';
    case 'domain':   return 'example.com\ncompany.io\nstartup.co';
    case 'url':      return 'https://www.linkedin.com/company/example\nhttps://www.linkedin.com/company/acme';
    default:         return 'Value 1\nValue 2\nValue 3';
  }
}

function getPasteLabel(field: ToolField): string {
  switch (field.type) {
    case 'linkedin': return 'LinkedIn URLs';
    case 'email':    return 'Email addresses';
    case 'phone':    return 'Phone numbers';
    case 'domain':   return 'Domains';
    case 'url':      return 'URLs';
    default:         return 'Values';
  }
}

export default function ToolPage() {
  const { toolId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tool = getToolById(toolId || '');
  const [step, setStep] = useState<Step>('input');
  const [inputMode, setInputMode] = useState<InputMode>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [pasteText, setPasteText] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Reset all input state when switching tools
  useEffect(() => {
    setStep('input');
    setInputMode('csv');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setPasteText('');
    setIsRunning(false);
  }, [toolId]);

  // The primary required field determines what bulk paste accepts
  const pasteField = tool?.requiredFields[0];
  const canPaste = !!pasteField;

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

      // Auto-detect: for each required field, find the best matching CSV column
      const initialMapping: Record<string, string> = {};
      const allFields = [...(tool?.requiredFields || []), ...(tool?.optionalFields || [])];
      for (const field of allFields) {
        const allAliases = [field.id, ...field.aliases];
        const match = h.find(header => {
          const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return allAliases.some(alias => headerLower.includes(alias.toLowerCase()));
        });
        if (match) initialMapping[field.id] = match;
      }
      setMapping(initialMapping);
      setStep('map');
    };
    reader.readAsText(f);
  };

  /** Parse pasted text into lines and advance to configure step. */
  const handlePasteSubmit = () => {
    if (!pasteField) return;
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    if (lines.length === 0) {
      toast({ title: 'No input', description: 'Please paste at least one value', variant: 'destructive' });
      return;
    }
    // Build preview rows using the primary field
    setHeaders([pasteField.id]);
    setRows(lines.slice(0, 20).map(l => ({ [pasteField.id]: l })));
    setMapping({ [pasteField.id]: pasteField.id });
    setFile(null); // ensure CSV mode is cleared
    setStep('configure');
  };

  const handleRun = async () => {
    if (!tool) return;
    setIsRunning(true);
    try {
      let batch;
      if (inputMode === 'paste' && pasteField) {
        // Build CSV string: header + one value per line
        const lines = pasteText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const csvString = [pasteField.id, ...lines].join('\n');
        batch = await batchApi.pasteRows(csvString, toolId);
      } else if (file) {
        batch = await batchApi.uploadCsv(file, toolId);
      } else {
        toast({ title: 'Error', description: 'No input provided', variant: 'destructive' });
        setIsRunning(false);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      const desc = inputMode === 'paste' ? `Processing ${rows.length}+ pasted rows` : `Processing ${file?.name}`;
      toast({ title: 'Run started', description: desc });
      navigate(`/runs/${batch.batchId}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to start run';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setIsRunning(false);
    }
  };

  if (!tool) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold">Tool not found</h2>
        <Button variant="link" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  // Steps differ: paste mode skips column mapping
  const steps: { key: Step; label: string }[] = inputMode === 'paste'
    ? [
        { key: 'input', label: 'Input' },
        { key: 'configure', label: 'Review' },
        { key: 'run', label: 'Run' },
      ]
    : [
        { key: 'input', label: 'Upload' },
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
        {step === 'input' && (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Input Mode Toggle */}
              {canPaste && (
                <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      inputMode === 'csv' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => { setInputMode('csv'); setStep('input'); }}
                  >
                    <FileText className="h-4 w-4" />
                    Upload CSV
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      inputMode === 'paste' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => { setInputMode('paste'); setStep('input'); }}
                  >
                    <Type className="h-4 w-4" />
                    Bulk Paste
                  </button>
                </div>
              )}

              {/* CSV Upload */}
              {inputMode === 'csv' && (
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
              )}

              {/* Bulk Paste */}
              {inputMode === 'paste' && pasteField && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-base font-medium">
                      Paste {getPasteLabel(pasteField)} <span className="text-muted-foreground font-normal">(one per line)</span>
                    </Label>
                  </div>
                  <Textarea
                    placeholder={getPastePlaceholder(pasteField)}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {pasteText.split('\n').filter(l => l.trim()).length} {getPasteLabel(pasteField).toLowerCase()} entered
                    </p>
                    <Button onClick={handlePasteSubmit} disabled={!pasteText.trim()}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'map' && (
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
              <CardDescription>Select which column from your CSV contains each required field</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data preview */}
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>{headers.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 3).map((row, i) => (
                      <TableRow key={i}>{headers.map(h => <TableCell key={h} className="truncate max-w-32">{row[h]}</TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* One selector per required field */}
              <div className="space-y-4">
                {tool.requiredFields.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <Label className="text-sm font-medium text-primary">{field.name}</Label>
                    <Select
                      value={mapping[field.id] || ''}
                      onValueChange={(col) => setMapping(prev => ({ ...prev, [field.id]: col }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select column for ${field.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                {tool.optionalFields.length > 0 && (
                  <>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider pt-2">Optional</div>
                    {tool.optionalFields.map(field => (
                      <div key={field.id} className="space-y-1.5">
                        <Label className="text-sm font-medium">{field.name}</Label>
                        <Select
                          value={mapping[field.id] || 'none'}
                          onValueChange={(col) => setMapping(prev => ({ ...prev, [field.id]: col === 'none' ? '' : col }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select column for ${field.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— None —</SelectItem>
                            {headers.map(h => (
                              <SelectItem key={h} value={h}>{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('input')}>Back</Button>
                <Button
                  onClick={() => setStep('configure')}
                  disabled={tool.requiredFields.some(f => !mapping[f.id])}
                >
                  Continue
                </Button>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Input:</span>
                  <span className="font-medium">{inputMode === 'paste' ? 'Bulk paste' : file?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rows:</span>
                  <span className="font-medium">{rows.length}{inputMode === 'csv' ? '+' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium">{inputMode === 'paste' ? `Bulk ${getPasteLabel(pasteField!)}` : 'CSV Upload'}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(inputMode === 'paste' ? 'input' : 'map')}>Back</Button>
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
