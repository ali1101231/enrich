import { 
  ApifyKey, 
  BlitzKey, 
  Run, 
  RunDetails, 
  OutputFile, 
  Notification, 
  User,
  DashboardStats,
  Tool
} from '@/types';

// Mock User
export const mockUser: User = {
  id: 'user-1',
  email: 'alex@enrichit.io',
  name: 'Alex Chen',
  plan: 'pro',
  createdAt: '2024-01-15T10:00:00Z',
};

// Mock Apify Keys
export const mockApifyKeys: ApifyKey[] = [
  {
    id: 'apify-1',
    label: 'Main Production',
    keyMasked: 'apify_api_****...****7x9K',
    enabled: true,
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z',
    lastUsedAt: '2024-02-07T14:30:00Z',
    requestsToday: 1247,
    successRate: 98.5,
  },
  {
    id: 'apify-2',
    label: 'Backup High Limit',
    keyMasked: 'apify_api_****...****2mPq',
    enabled: true,
    status: 'active',
    createdAt: '2024-02-01T08:00:00Z',
    lastUsedAt: '2024-02-07T12:15:00Z',
    requestsToday: 523,
    successRate: 99.1,
  },
  {
    id: 'apify-3',
    label: 'Test Environment',
    keyMasked: 'apify_api_****...****8nLz',
    enabled: false,
    status: 'invalid',
    createdAt: '2024-01-25T15:00:00Z',
    lastUsedAt: null,
    requestsToday: 0,
    successRate: 0,
  },
];

// Mock Blitz Keys
export const mockBlitzKeys: BlitzKey[] = [
  {
    id: 'blitz-1',
    label: 'Production Key',
    keyMasked: 'blitz_****...****9xKm',
    enabled: true,
    status: 'active',
    createdAt: '2024-01-18T12:00:00Z',
    lastUsedAt: '2024-02-07T15:45:00Z',
    requestsToday: 892,
    plan: 'Enterprise',
    rateLimit: 10000,
  },
];

// Mock Runs
export const mockRuns: Run[] = [
  {
    id: 'run-1',
    toolId: 'blitz-email-enricher',
    toolName: 'Email Enricher',
    toolProvider: 'blitz',
    inputFileName: 'leads_batch_1.csv',
    status: 'running',
    progress: 67,
    rowsProcessed: 1340,
    totalRows: 2000,
    stage: 'processing',
    startedAt: '2024-02-07T14:00:00Z',
    eta: '~12 min',
    keyLabel: 'Production Key',
  },
  {
    id: 'run-2',
    toolId: 'blitz-phone-enricher',
    toolName: 'Phone Finder',
    toolProvider: 'blitz',
    inputFileName: 'contacts_q1.csv',
    status: 'paused',
    progress: 45,
    rowsProcessed: 450,
    totalRows: 1000,
    stage: 'processing',
    startedAt: '2024-02-07T13:30:00Z',
    keyLabel: 'Production Key',
  },
  {
    id: 'run-3',
    toolId: 'blitz-company-enricher',
    toolName: 'Company Enricher',
    toolProvider: 'blitz',
    inputFileName: 'companies.csv',
    status: 'completed',
    progress: 100,
    rowsProcessed: 500,
    totalRows: 500,
    stage: 'completed',
    startedAt: '2024-02-07T10:00:00Z',
    completedAt: '2024-02-07T11:23:00Z',
    keyLabel: 'Production Key',
  },
  {
    id: 'run-4',
    toolId: 'blitz-domain-to-linkedin',
    toolName: 'Domain to LinkedIn',
    toolProvider: 'blitz',
    inputFileName: 'domains.csv',
    status: 'failed',
    progress: 23,
    rowsProcessed: 230,
    totalRows: 1000,
    stage: 'failed',
    startedAt: '2024-02-07T09:00:00Z',
    completedAt: '2024-02-07T09:15:00Z',
    keyLabel: 'Production Key',
    error: 'Rate limit exceeded. Please try again later.',
  },
  {
    id: 'run-5',
    toolId: 'blitz-email-enricher',
    toolName: 'Email Enricher',
    toolProvider: 'blitz',
    inputFileName: 'prospects_q1.csv',
    status: 'completed',
    progress: 100,
    rowsProcessed: 5000,
    totalRows: 5000,
    stage: 'completed',
    startedAt: '2024-02-06T16:00:00Z',
    completedAt: '2024-02-06T16:05:00Z',
  },
];

// Mock Run Details
export const mockRunDetails: RunDetails = {
  ...mockRuns[0],
  metrics: {
    processed: 1340,
    found: 1287,
    skipped: 42,
    errors: 11,
  },
  logs: [
    { id: 'log-1', timestamp: '2024-02-07T14:00:00Z', level: 'info', message: 'Run started' },
    { id: 'log-2', timestamp: '2024-02-07T14:00:05Z', level: 'info', message: 'File uploaded successfully (2.3 MB)' },
    { id: 'log-3', timestamp: '2024-02-07T14:00:10Z', level: 'info', message: 'Column mapping validated' },
    { id: 'log-4', timestamp: '2024-02-07T14:00:15Z', level: 'info', message: 'Processing started with key: Main Production' },
    { id: 'log-5', timestamp: '2024-02-07T14:15:00Z', level: 'warn', message: 'Row 523: Invalid LinkedIn URL format, skipped' },
    { id: 'log-6', timestamp: '2024-02-07T14:30:00Z', level: 'info', message: 'Checkpoint: 1000 rows processed' },
    { id: 'log-7', timestamp: '2024-02-07T14:45:00Z', level: 'error', message: 'Row 1156: API timeout, retrying...' },
    { id: 'log-8', timestamp: '2024-02-07T14:45:05Z', level: 'info', message: 'Row 1156: Retry successful' },
  ],
  columnMapping: {
    'LinkedIn URL': 'linkedin_url',
    'Full Name': 'name',
    'Company': 'company',
    'Title': 'job_title',
  },
  config: {
    includeComments: true,
    maxCommentsPerPost: 100,
    filterByEngagement: true,
  },
  outputs: [],
};

// Mock Output Files
export const mockOutputFiles: OutputFile[] = [
  {
    id: 'file-1',
    name: 'companies_enriched.csv',
    size: 2456000,
    type: 'csv',
    createdAt: '2024-02-07T11:23:00Z',
    runId: 'run-3',
    toolName: 'Company Enricher',
  },
  {
    id: 'file-2',
    name: 'emails_enriched.csv',
    size: 1234000,
    type: 'csv',
    createdAt: '2024-02-06T16:05:00Z',
    runId: 'run-5',
    toolName: 'Email Enricher',
  },
  {
    id: 'file-3',
    name: 'phones_found.csv',
    size: 892000,
    type: 'csv',
    createdAt: '2024-02-05T18:30:00Z',
    runId: 'run-old-1',
    toolName: 'Phone Finder',
  },
  {
    id: 'file-4',
    name: 'domains_linkedin.csv',
    size: 567000,
    type: 'csv',
    createdAt: '2024-02-04T14:00:00Z',
    runId: 'run-old-2',
    toolName: 'Domain to LinkedIn',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'run-completed',
    title: 'Run Completed',
    message: 'Company Enricher finished processing 500 rows',
    timestamp: '2024-02-07T11:23:00Z',
    read: false,
    runId: 'run-3',
  },
  {
    id: 'notif-2',
    type: 'run-failed',
    title: 'Run Failed',
    message: 'Domain to LinkedIn failed: Rate limit exceeded',
    timestamp: '2024-02-07T09:15:00Z',
    read: false,
    runId: 'run-4',
  },
  {
    id: 'notif-3',
    type: 'key-warning',
    title: 'Key Warning',
    message: 'Apify key "Test Environment" marked as invalid',
    timestamp: '2024-02-06T10:00:00Z',
    read: true,
  },
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  activeRuns: 2,
  successRate: 87.5,
  avgRuntime: 1845, // 30 min 45 sec
  totalRunsToday: 8,
  apifyKeysActive: 2,
  blitzKeyValid: true,
};

// Mock Tools
export const mockTools: Tool[] = [
  {
    id: 'blitz-email-enricher',
    name: 'Email Enricher',
    description: 'Find verified email addresses from LinkedIn profile URLs',
    provider: 'blitz',
    icon: 'MailPlus',
    category: 'Enrichment',
    requiredFields: [
      { id: 'person_linkedin_url', name: 'LinkedIn URL', description: 'LinkedIn profile URL', type: 'linkedin', aliases: ['linkedin_url', 'linkedin', 'profile_url', 'url', 'person_url'] },
    ],
    optionalFields: [],
  },
  {
    id: 'blitz-phone-enricher',
    name: 'Phone Finder',
    description: 'Find phone numbers from LinkedIn profile URLs',
    provider: 'blitz',
    icon: 'Phone',
    category: 'Enrichment',
    requiredFields: [
      { id: 'person_linkedin_url', name: 'LinkedIn URL', description: 'LinkedIn profile URL', type: 'linkedin', aliases: ['linkedin_url', 'linkedin', 'profile_url', 'url', 'person_url'] },
    ],
    optionalFields: [],
  },
  {
    id: 'blitz-company-enricher',
    name: 'Company Enricher',
    description: 'Get detailed company information from LinkedIn company URLs',
    provider: 'blitz',
    icon: 'Building2',
    category: 'Enrichment',
    requiredFields: [
      { id: 'company_linkedin_url', name: 'Company LinkedIn URL', description: 'LinkedIn company page URL', type: 'url', aliases: ['company_url', 'company_linkedin', 'linkedin_url', 'url'] },
    ],
    optionalFields: [],
  },
  {
    id: 'blitz-domain-to-linkedin',
    name: 'Domain to LinkedIn',
    description: 'Find LinkedIn company page from a domain',
    provider: 'blitz',
    icon: 'Linkedin',
    category: 'Conversion',
    requiredFields: [
      { id: 'domain', name: 'Domain', description: 'Company domain or website URL', type: 'domain', aliases: ['website', 'url', 'company_domain', 'company_website'] },
    ],
    optionalFields: [],
  },
];

// Helper to get tool by ID
export const getToolById = (id: string) => 
  mockTools.find(t => t.id === id);
