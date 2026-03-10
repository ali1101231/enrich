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
  email: 'alex@koldify.io',
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
    toolId: 'post-finder',
    toolName: 'Post Finder',
    toolProvider: 'apify',
    inputFileName: 'leads_batch_1.csv',
    status: 'running',
    progress: 67,
    rowsProcessed: 1340,
    totalRows: 2000,
    stage: 'processing',
    startedAt: '2024-02-07T14:00:00Z',
    eta: '~12 min',
    keyLabel: 'Main Production',
  },
  {
    id: 'run-2',
    toolId: 'email-enricher',
    toolName: 'Email Enricher',
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
    toolId: 'linkedin-scraper',
    toolName: 'LinkedIn Comment Scraper',
    toolProvider: 'apify',
    inputFileName: 'viral_posts.csv',
    status: 'completed',
    progress: 100,
    rowsProcessed: 500,
    totalRows: 500,
    stage: 'completed',
    startedAt: '2024-02-07T10:00:00Z',
    completedAt: '2024-02-07T11:23:00Z',
    keyLabel: 'Main Production',
  },
  {
    id: 'run-4',
    toolId: 'reverse-phone',
    toolName: 'Reverse Phone Lookup',
    toolProvider: 'blitz',
    inputFileName: 'phone_list.csv',
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
    toolId: 'csv-dedup',
    toolName: 'CSV Deduplicator',
    toolProvider: 'csv',
    inputFileName: 'master_list.csv',
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
    name: 'linkedin_comments_enriched.csv',
    size: 2456000,
    type: 'csv',
    createdAt: '2024-02-07T11:23:00Z',
    runId: 'run-3',
    toolName: 'LinkedIn Comment Scraper',
  },
  {
    id: 'file-2',
    name: 'master_list_deduped.csv',
    size: 1234000,
    type: 'csv',
    createdAt: '2024-02-06T16:05:00Z',
    runId: 'run-5',
    toolName: 'CSV Deduplicator',
  },
  {
    id: 'file-3',
    name: 'posts_found_batch1.csv',
    size: 892000,
    type: 'csv',
    createdAt: '2024-02-05T18:30:00Z',
    runId: 'run-old-1',
    toolName: 'Post Finder',
  },
  {
    id: 'file-4',
    name: 'emails_enriched_q1.csv',
    size: 567000,
    type: 'csv',
    createdAt: '2024-02-04T14:00:00Z',
    runId: 'run-old-2',
    toolName: 'Blitz Email Enricher',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'run-completed',
    title: 'Run Completed',
    message: 'LinkedIn Comment Scraper finished processing 500 rows',
    timestamp: '2024-02-07T11:23:00Z',
    read: false,
    runId: 'run-3',
  },
  {
    id: 'notif-2',
    type: 'run-failed',
    title: 'Run Failed',
    message: 'Reverse Phone Lookup failed: Rate limit exceeded',
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
  // Apify Tools
  {
    id: 'post-finder',
    name: 'Post Finder',
    description: 'Find viral LinkedIn posts based on keywords and engagement metrics',
    provider: 'apify',
    icon: 'Search',
    category: 'Discovery',
    requiredFields: [
      { id: 'keywords', name: 'Keywords', description: 'Search keywords', type: 'text', aliases: ['keyword', 'search', 'query'] },
    ],
    optionalFields: [
      { id: 'min_likes', name: 'Min Likes', description: 'Minimum likes', type: 'number', aliases: ['likes', 'min_engagement'] },
    ],
  },
  {
    id: 'reaction-scraper',
    name: 'Reaction Scraper',
    description: 'Scrape reactions and engagement data from LinkedIn posts',
    provider: 'apify',
    icon: 'Heart',
    category: 'Engagement',
    requiredFields: [
      { id: 'post_url', name: 'Post URL', description: 'LinkedIn post URL', type: 'url', aliases: ['url', 'link', 'post_link'] },
    ],
    optionalFields: [],
  },
  {
    id: 'linkedin-comment-scraper',
    name: 'LinkedIn Comment Scraper',
    description: 'Extract comments and commenters from LinkedIn posts',
    provider: 'apify',
    icon: 'MessageSquare',
    category: 'Engagement',
    requiredFields: [
      { id: 'post_url', name: 'Post URL', description: 'LinkedIn post URL', type: 'url', aliases: ['url', 'link', 'linkedin_url'] },
    ],
    optionalFields: [
      { id: 'max_comments', name: 'Max Comments', description: 'Maximum comments to scrape', type: 'number', aliases: ['limit'] },
    ],
  },
  {
    id: 'apify-email-enricher',
    name: 'Apify Email Enricher',
    description: 'Enrich emails with LinkedIn and company data',
    provider: 'apify',
    icon: 'Mail',
    category: 'Enrichment',
    requiredFields: [
      { id: 'email', name: 'Email', description: 'Email address', type: 'email', aliases: ['email_address', 'e-mail'] },
    ],
    optionalFields: [],
  },
  {
    id: 'linkedin-profile-enhancer',
    name: 'LinkedIn Profile Enhancer',
    description: 'Get detailed profile information from LinkedIn URLs',
    provider: 'apify',
    icon: 'UserPlus',
    category: 'Enrichment',
    requiredFields: [
      { id: 'linkedin_url', name: 'LinkedIn URL', description: 'LinkedIn profile URL', type: 'linkedin', aliases: ['profile_url', 'linkedin', 'url'] },
    ],
    optionalFields: [],
  },
  {
    id: 'contact-details-scraper',
    name: 'Contact Details Scraper',
    description: 'Extract contact information from profiles',
    provider: 'apify',
    icon: 'Contact',
    category: 'Enrichment',
    requiredFields: [
      { id: 'linkedin_url', name: 'LinkedIn URL', description: 'LinkedIn profile URL', type: 'linkedin', aliases: ['profile_url', 'linkedin', 'url'] },
    ],
    optionalFields: [],
  },
  {
    id: 'inmail-checker',
    name: 'InMail Checker',
    description: 'Check if LinkedIn profiles accept InMail messages',
    provider: 'apify',
    icon: 'Send',
    category: 'Validation',
    requiredFields: [
      { id: 'linkedin_url', name: 'LinkedIn URL', description: 'LinkedIn profile URL', type: 'linkedin', aliases: ['profile_url', 'linkedin', 'url'] },
    ],
    optionalFields: [],
  },
  // Blitz Tools
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
  // CSV Tools
  {
    id: 'csv-splitter',
    name: 'CSV Splitter',
    description: 'Split large CSV files into smaller chunks',
    provider: 'csv',
    icon: 'Scissors',
    category: 'Transform',
    requiredFields: [],
    optionalFields: [
      { id: 'rows_per_file', name: 'Rows per File', description: 'Number of rows per output file', type: 'number', aliases: ['chunk_size', 'split_size'] },
    ],
  },
  {
    id: 'csv-merger',
    name: 'CSV Merger',
    description: 'Merge multiple CSV files into one',
    provider: 'csv',
    icon: 'Combine',
    category: 'Transform',
    requiredFields: [],
    optionalFields: [],
  },
  {
    id: 'csv-deduplicator',
    name: 'CSV Deduplicator',
    description: 'Remove duplicate rows based on key columns',
    provider: 'csv',
    icon: 'Copy',
    category: 'Transform',
    requiredFields: [],
    optionalFields: [
      { id: 'key_column', name: 'Key Column', description: 'Column to use for deduplication', type: 'text', aliases: ['dedup_key', 'unique_key'] },
    ],
  },
];

// Helper to get tools by provider
export const getToolsByProvider = (provider: 'apify' | 'blitz' | 'csv') => 
  mockTools.filter(t => t.provider === provider);

// Helper to get tool by ID
export const getToolById = (id: string) => 
  mockTools.find(t => t.id === id);
