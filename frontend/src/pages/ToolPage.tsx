import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ChevronRight, Play, CheckCircle2, Loader2, FileText, Type, Coins, AlertTriangle, Pin, PinOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { getToolById } from '@/lib/mockData';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { batchApi, ApiError } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useCredits, useToolCreditCost } from '@/hooks/useApi';
import type { ToolField } from '@/types';

type Step = 'input' | 'map' | 'configure' | 'run';
type InputMode = 'csv' | 'paste';
type ShowcaseTone = 'neutral' | 'success' | 'warning';

type ToolShowcase = {
  summary: string;
  acceptedInput: string;
  deliveredOutput: string;
  idealFor: string;
  highlights: string[];
  sampleHeaders: string[];
  sampleRows: string[][];
  mappedFieldLabel: string;
  mappedColumnLabel: string;
  previewFileName: string;
  previewRows: string;
  costPerRow: string;
  creditCost: string;
  resultStats: Array<{
    label: string;
    value: string;
    tone: ShowcaseTone;
  }>;
  resultSummary: string;
};

const toolShowcases: Record<string, ToolShowcase> = {
  'email-enricher': {
    summary: 'Upload LinkedIn profile URLs, map the right column, confirm credits, and export verified work emails in a few clicks.',
    acceptedInput: 'LinkedIn profile URLs via CSV upload or bulk paste',
    deliveredOutput: 'Verified work emails, run tracking, and export-ready CSV output',
    idealFor: 'Outbound prospecting, lead enrichment, and CRM cleanup before campaigns go live.',
    highlights: ['CSV upload and bulk paste input modes', 'Guided column mapping before launch', 'Live run tracking with exportable results'],
    sampleHeaders: ['Full Name', 'LinkedIn URL', 'Company'],
    sampleRows: [
      ['Tim Zheng', 'linkedin.com/in/timzheng', 'Enrich It'],
      ['Arlo Simmons', 'linkedin.com/in/arlo-simmons', 'The Bussin Design'],
      ['Mina Patel', 'linkedin.com/in/mina-patel', 'Apollo'],
    ],
    mappedFieldLabel: 'LinkedIn URL',
    mappedColumnLabel: 'person_linkedin_url',
    previewFileName: 'apollo_people_2026-01.csv',
    previewRows: '75',
    costPerRow: '1 credit',
    creditCost: '75 credits',
    resultStats: [
      { label: 'Rows Enriched', value: '60', tone: 'success' },
      { label: 'Rows Skipped', value: '0', tone: 'warning' },
      { label: 'Rows Failed', value: '0', tone: 'neutral' },
    ],
    resultSummary: 'Verified emails are appended to matched profiles and exported as a clean CSV for outreach.',
  },
  'phone-enricher': {
    summary: 'Start from LinkedIn profile URLs and turn them into usable phone contact data with the same guided import-to-export flow.',
    acceptedInput: 'LinkedIn profile URLs via CSV upload or bulk paste',
    deliveredOutput: 'Phone numbers, run progress, and downloadable CSV results',
    idealFor: 'Sales teams that need direct dial coverage before sequencing or calling.',
    highlights: ['Preview your input rows before launch', 'Match the LinkedIn field once and reuse the workflow', 'Track completed, skipped, and failed rows during the run'],
    sampleHeaders: ['Full Name', 'LinkedIn URL', 'Job Title'],
    sampleRows: [
      ['Maya Brooks', 'linkedin.com/in/maya-brooks', 'Growth Lead'],
      ['Chris Nolan', 'linkedin.com/in/chris-nolan', 'Account Executive'],
      ['Ivy Santos', 'linkedin.com/in/ivy-santos', 'Sales Ops'],
    ],
    mappedFieldLabel: 'LinkedIn URL',
    mappedColumnLabel: 'person_linkedin_url',
    previewFileName: 'phone_finder_targets.csv',
    previewRows: '120',
    costPerRow: '2 credits',
    creditCost: '240 credits',
    resultStats: [
      { label: 'Numbers Found', value: '88', tone: 'success' },
      { label: 'Rows Skipped', value: '7', tone: 'warning' },
      { label: 'Rows Failed', value: '1', tone: 'neutral' },
    ],
    resultSummary: 'Phone Finder returns direct dials and mobile matches in an export-ready output file.',
  },
  'company-enricher': {
    summary: 'Feed in company LinkedIn URLs and enrich them with structured firmographic data through a clear four-step workflow.',
    acceptedInput: 'Company LinkedIn URLs in CSV format or bulk input',
    deliveredOutput: 'Company details, enrichment status, and downloadable results',
    idealFor: 'Research, account scoring, TAM expansion, and cleaning company records before routing.',
    highlights: ['See a sample of uploaded company rows instantly', 'Validate your LinkedIn company column before running', 'Export enriched firmographic data when the run finishes'],
    sampleHeaders: ['Company Name', 'Website', 'LinkedIn', 'Employees'],
    sampleRows: [
      ['Canonical', 'canonical.com', 'linkedin.com/company/canonical', '800'],
      ['Confluent', 'confluent.io', 'linkedin.com/company/confluent', '100'],
      ['Inovi8', 'inovi8.com', 'linkedin.com/company/inovi8', '73'],
    ],
    mappedFieldLabel: 'Company LinkedIn URL',
    mappedColumnLabel: 'company_linkedin_url',
    previewFileName: 'apollo_companies_2026-01.csv',
    previewRows: '75',
    costPerRow: '1 credit',
    creditCost: '75 credits',
    resultStats: [
      { label: 'Companies Enriched', value: '60', tone: 'success' },
      { label: 'Rows Skipped', value: '0', tone: 'warning' },
      { label: 'Rows Failed', value: '0', tone: 'neutral' },
    ],
    resultSummary: 'The export includes structured company fields ready for segmentation, routing, or downstream scoring.',
  },
  'domain-to-linkedin': {
    summary: 'Upload company domains, map the website field, and convert them into LinkedIn company URLs with a guided run flow.',
    acceptedInput: 'Domains or company websites via CSV upload or bulk paste',
    deliveredOutput: 'LinkedIn company URLs, completion status, and CSV export',
    idealFor: 'Website-based prospect lists that need matching LinkedIn company pages before enrichment.',
    highlights: ['Start from domains instead of profile URLs', 'Map the website column before you spend credits', 'Export matched LinkedIn company URLs for the next workflow'],
    sampleHeaders: ['Company', 'Domain', 'Country'],
    sampleRows: [
      ['Enrich It', 'enrich-it.io', 'US'],
      ['Apollo', 'apollo.io', 'US'],
      ['Confluent', 'confluent.io', 'US'],
    ],
    mappedFieldLabel: 'Domain',
    mappedColumnLabel: 'domain',
    previewFileName: 'domain_lookup_targets.csv',
    previewRows: '240',
    costPerRow: '1 credit',
    creditCost: '240 credits',
    resultStats: [
      { label: 'Profiles Found', value: '180', tone: 'success' },
      { label: 'Rows Skipped', value: '12', tone: 'warning' },
      { label: 'Rows Failed', value: '3', tone: 'neutral' },
    ],
    resultSummary: 'Matched LinkedIn company URLs can be exported directly or sent into Company Enricher next.',
  },
};

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

  const { preferences, togglePinnedTool } = useApp();
  const tool = getToolById(toolId || '');
  const isPinned = tool ? preferences.pinnedTools.includes(tool.id) : false;
  const [step, setStep] = useState<Step>('input');
  const [inputMode, setInputMode] = useState<InputMode>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [pasteText, setPasteText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [totalRowCount, setTotalRowCount] = useState(0);
  const { data: creditBalance = 0 } = useCredits();
  const { data: creditCostPerRow = 1 } = useToolCreditCost(toolId);

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
    setTotalRowCount(0);
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
      setTotalRowCount(lines.length - 1);

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
    setTotalRowCount(lines.length);
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

  const showcase = toolShowcases[tool.id] ?? toolShowcases['email-enricher'];

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
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-koldify shadow-glow-sm">
            <Play className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{tool.name}</h1>
            </div>
            <p className="text-muted-foreground">{tool.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => togglePinnedTool(tool.id)}
            className={cn('shrink-0', isPinned && 'text-primary')}
            title={isPinned ? 'Unpin tool' : 'Pin tool'}
          >
            {isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]"
        >
          <Card className="border-primary/10 bg-[linear-gradient(180deg,rgba(126,87,255,0.06),rgba(255,255,255,0.94))] shadow-[0_28px_60px_-40px_rgba(111,76,198,0.45)]">
            <CardHeader className="space-y-4">
              <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                How It Works
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl leading-tight tracking-tight">{tool.name} walkthrough</CardTitle>
                <CardDescription className="max-w-2xl text-[15px] leading-6 text-foreground/75">
                  {showcase.summary}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-primary/10 bg-white/90 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Accepted Input</div>
                  <div className="mt-2 text-sm font-medium leading-6 text-foreground">{showcase.acceptedInput}</div>
                </div>
                <div className="rounded-2xl border border-primary/10 bg-white/90 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Delivered Output</div>
                  <div className="mt-2 text-sm font-medium leading-6 text-foreground">{showcase.deliveredOutput}</div>
                </div>
                <div className="rounded-2xl border border-primary/10 bg-white/90 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Best For</div>
                  <div className="mt-2 text-sm font-medium leading-6 text-foreground">{showcase.idealFor}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {showcase.highlights.map((highlight) => (
                  <div key={highlight} className="rounded-full border border-primary/10 bg-white/85 px-3 py-1.5 text-xs font-medium text-foreground/75">
                    {highlight}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setStep('input')} className="gap-2">
                  Open {tool.name}
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setStep(inputMode === 'paste' ? 'configure' : 'map')}>
                  Jump to workflow preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white/90 shadow-[0_24px_50px_-36px_rgba(111,76,198,0.45)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl tracking-tight">What the run looks like</CardTitle>
              <CardDescription className="text-sm leading-6">
                Each tool follows the same product flow: import, validate, configure, then export results.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { title: '1. Upload', text: 'Bring in a CSV or paste rows directly into the tool.' },
                { title: '2. Map Columns', text: 'Confirm which column contains the primary field before running.' },
                { title: '3. Configure', text: 'Review file size, credits, and launch settings before starting.' },
                { title: '4. Results', text: 'Track job status, monitor progress, and export the finished CSV.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid gap-4 lg:grid-cols-2"
        >
          <Card className="border-primary/10 bg-white/90 shadow-[0_22px_45px_-38px_rgba(111,76,198,0.55)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Upload className="h-4 w-4" />
                Step 1
              </div>
              <CardTitle className="text-xl">Upload your source data</CardTitle>
              <CardDescription>{showcase.acceptedInput}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 rounded-xl bg-muted/70 p-1 w-fit">
                <div className="rounded-lg bg-background px-4 py-2 text-sm font-semibold shadow-sm">Upload CSV</div>
                <div className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground">Bulk Paste</div>
              </div>
              <div className="rounded-[24px] border-2 border-dashed border-primary/20 bg-primary/5 px-6 py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Upload className="h-7 w-7" />
                </div>
                <div className="mt-4 text-lg font-semibold">Drop your CSV file here</div>
                <div className="mt-1 text-sm text-muted-foreground">or click to browse and preview your first rows</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white/90 shadow-[0_22px_45px_-38px_rgba(111,76,198,0.55)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <FileText className="h-4 w-4" />
                Step 2
              </div>
              <CardTitle className="text-xl">Map the right field</CardTitle>
              <CardDescription>Preview rows and select the column that powers the enrichment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                <ScrollArea className="w-full">
                  <div className="min-w-[420px]">
                    <div className="grid border-b border-border/70 bg-background/80 text-xs font-semibold text-muted-foreground" style={{ gridTemplateColumns: `repeat(${showcase.sampleHeaders.length}, minmax(0, 1fr))` }}>
                      {showcase.sampleHeaders.map((header) => (
                        <div key={header} className="px-4 py-3">{header}</div>
                      ))}
                    </div>
                    {showcase.sampleRows.map((row, rowIndex) => (
                      <div key={`${row[0]}-${rowIndex}`} className="grid border-b border-border/50 text-sm" style={{ gridTemplateColumns: `repeat(${showcase.sampleHeaders.length}, minmax(0, 1fr))` }}>
                        {row.map((cell, cellIndex) => (
                          <div key={`${cell}-${cellIndex}`} className="truncate px-4 py-3 text-foreground/80">{cell}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
              <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Mapped Field</div>
                <div className="mt-1 text-sm text-foreground">
                  {showcase.mappedFieldLabel} <span className="text-muted-foreground">-></span> {showcase.mappedColumnLabel}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white/90 shadow-[0_22px_45px_-38px_rgba(111,76,198,0.55)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Coins className="h-4 w-4" />
                Step 3
              </div>
              <CardTitle className="text-xl">Review before launch</CardTitle>
              <CardDescription>See the file summary, row count, and credits before starting the run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted/35 p-4">
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted-foreground">Input</span>
                  <span className="font-medium">{showcase.previewFileName}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted-foreground">Rows</span>
                  <span className="font-medium">{showcase.previewRows}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="font-medium">CSV Upload</span>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Credit Cost
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cost per row</span>
                    <span className="font-medium">{showcase.costPerRow}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Credits required</span>
                    <span className="font-medium">{showcase.creditCost}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white/90 shadow-[0_22px_45px_-38px_rgba(111,76,198,0.55)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Step 4
              </div>
              <CardTitle className="text-xl">Track and export results</CardTitle>
              <CardDescription>{showcase.resultSummary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {showcase.resultStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</div>
                    <div className={cn(
                      'mt-2 text-3xl font-bold tracking-tight',
                      stat.tone === 'success' ? 'text-emerald-500' : stat.tone === 'warning' ? 'text-amber-500' : 'text-primary'
                    )}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="text-sm font-medium text-foreground">Outputs</div>
                <div className="mt-3 rounded-xl gradient-koldify px-4 py-3 text-center text-sm font-semibold text-white shadow-glow-sm">
                  Export Results CSV
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center gap-2"
        >
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                i < stepIndex ? 'gradient-koldify text-white shadow-glow-sm' : i === stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('ml-2 text-sm hidden sm:inline', i <= stepIndex ? 'font-medium' : 'text-muted-foreground')}>
                {s.label}
              </span>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
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
                  className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 transition-colors">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
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
          </motion.div>
        )}

        {step === 'map' && (
          <motion.div key="map" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
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
          </motion.div>
        )}

        {step === 'configure' && (
          <motion.div key="configure" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
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
                  <span className="font-medium">{totalRowCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium">{inputMode === 'paste' ? `Bulk ${getPasteLabel(pasteField!)}` : 'CSV Upload'}</span>
                </div>
              </div>

              {/* Credit Cost Preview */}
              <div className={cn(
                'p-4 rounded-lg border space-y-2',
                totalRowCount * creditCostPerRow > creditBalance ? 'border-destructive/50 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'
              )}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Coins className="h-4 w-4 text-amber-500" />
                  Credit Cost
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost per URL:</span>
                  <span className="font-semibold">{creditCostPerRow} credit{creditCostPerRow !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits required:</span>
                  <span className="font-semibold">{(totalRowCount * creditCostPerRow).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your balance:</span>
                  <span className="font-semibold">{creditBalance.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">After run:</span>
                  <span className={cn('font-semibold', totalRowCount * creditCostPerRow > creditBalance ? 'text-destructive' : 'text-success')}>
                    {(creditBalance - totalRowCount * creditCostPerRow).toLocaleString()}
                  </span>
                </div>
                {totalRowCount * creditCostPerRow > creditBalance && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    Insufficient credits. Please purchase more credits to start this run.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(inputMode === 'paste' ? 'input' : 'map')}>Back</Button>
                <Button className="gradient-koldify text-white" onClick={handleRun} disabled={isRunning || totalRowCount * creditCostPerRow > creditBalance}>
                  {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Run ({(totalRowCount * creditCostPerRow).toLocaleString()} credits)
                </Button>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
