// API Contract Types for Koldify SaaS
// Backend endpoints to implement:

/*
AUTH:
  POST /auth/login - { email, password } => { user, token }
  POST /auth/signup - { email, password, name } => { user, token }
  POST /auth/logout - {} => {}
  POST /auth/reset-password - { email } => {}

KEYS:
  GET /keys/apify - [] => ApifyKey[]
  POST /keys/apify - { label, key } => ApifyKey
  PUT /keys/apify/:id - { label?, enabled? } => ApifyKey
  DELETE /keys/apify/:id - {} => {}
  
  GET /keys/blitz - [] => BlitzKey[]
  POST /keys/blitz - { label, key } => BlitzKey
  PUT /keys/blitz/:id - { label?, enabled? } => BlitzKey
  DELETE /keys/blitz/:id - {} => {}

RUNS:
  POST /runs - RunConfig => Run
  GET /runs?status=running|paused|pending|completed|failed => Run[]
  GET /runs/:id => RunDetails
  POST /runs/:id/pause => Run
  POST /runs/:id/resume => Run
  POST /runs/:id/stop => Run
  POST /runs/:id/retry => Run

FILES:
  GET /files => OutputFile[]
  GET /files/:id/download => Binary
  POST /files/upload => { fileId, previewRows }
*/

// ============ User Types ============
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

// ============ Key Types ============
export type KeyStatus = 'active' | 'rate-limited' | 'invalid' | 'checking';

export interface ApifyKey {
  id: string;
  label: string;
  keyMasked: string;
  enabled: boolean;
  status: KeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
  requestsToday: number;
  successRate: number;
}

export interface BlitzKey {
  id: string;
  label: string;
  keyMasked: string;
  enabled: boolean;
  status: KeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
  requestsToday: number;
  plan?: string;
  rateLimit?: number;
}

// ============ Run Types ============
export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type RunStage = 'uploading' | 'preparing' | 'processing' | 'writing' | 'completed' | 'failed';

export interface Run {
  id: string;
  toolId: string;
  toolName: string;
  toolProvider: 'apify' | 'blitz' | 'csv';
  inputFileName: string;
  status: RunStatus;
  progress: number;
  rowsProcessed: number;
  totalRows: number;
  stage: RunStage;
  startedAt: string;
  completedAt?: string;
  eta?: string;
  keyLabel?: string;
  error?: string;
}

export interface RunMetrics {
  processed: number;
  found: number;
  skipped: number;
  errors: number;
}

export interface RunLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface RunDetails extends Run {
  metrics: RunMetrics;
  logs: RunLog[];
  columnMapping: Record<string, string>;
  config: Record<string, unknown>;
  outputs: OutputFile[];
}

// ============ File Types ============
export interface OutputFile {
  id: string;
  name: string;
  size: number;
  type: 'csv' | 'xlsx' | 'json';
  createdAt: string;
  runId: string;
  toolName: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  previewRows: Record<string, string>[];
  headers: string[];
  totalRows: number;
}

// ============ Column Mapping Types ============
export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  required: boolean;
}

export interface MappingPreset {
  id: string;
  name: string;
  toolId: string;
  mapping: Record<string, string>;
  createdAt: string;
}

// ============ Tool Types ============
export type ToolProvider = 'apify' | 'blitz' | 'csv';

export interface Tool {
  id: string;
  name: string;
  description: string;
  provider: ToolProvider;
  icon: string;
  requiredFields: ToolField[];
  optionalFields: ToolField[];
  category: string;
}

export interface ToolField {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'email' | 'url' | 'phone' | 'linkedin' | 'domain' | 'number';
  aliases: string[]; // For auto-detection
}

// ============ Dashboard Types ============
export interface DashboardStats {
  activeRuns: number;
  successRate: number;
  avgRuntime: number; // in seconds
  totalRunsToday: number;
  apifyKeysActive: number;
  blitzKeyValid: boolean;
}

// ============ Notification Types ============
export interface Notification {
  id: string;
  type: 'run-started' | 'run-completed' | 'run-failed' | 'run-paused' | 'key-warning' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  runId?: string;
}

// ============ Settings Types ============
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    runCompleted: boolean;
    runFailed: boolean;
    keyWarnings: boolean;
  };
  pinnedTools: string[];
  defaultKeyStrategy: 'rotate' | 'healthiest' | 'manual';
}
