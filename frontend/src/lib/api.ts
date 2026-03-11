const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("koldify-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem("koldify-token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Do NOT set Content-Type — browser sets multipart boundary automatically
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- Auth ----
export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  credits: number;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  register(email: string, password: string, displayName?: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return request<AuthUser>("/auth/me");
  },
};

// ---- Admin ----
export interface AdminKeyItem {
  id: string;
  label: string;
  isActive: boolean;
  activeUsers: number;
  maxUsers: number;
  requestsPerSecond: number;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  credits: number;
  createdAt: string;
}

export interface AssignmentItem {
  id: string;
  userId: string;
  apiKeyId: string;
  isManual: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminBatchItem {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  toolId: string | null;
  sourceType: string;
  originalFileName: string | null;
  totalRows: number;
  status: string;
  completedRows: number;
  failedRows: number;
  runningRows: number;
  queuedRows: number;
  createdAt: string;
}

export interface AdminUserDetail {
  user: AdminUserItem;
  stats: {
    totalBatches: number;
    completedBatches: number;
    activeBatches: number;
    failedBatches: number;
    totalRowsProcessed: number;
    totalExports: number;
  };
  assignments: Array<{
    id: string;
    apiKeyId: string;
    isManual: boolean;
    createdAt: string;
    apiKey: {
      id: string;
      label: string;
      isActive: boolean;
      requestsPerSecond: number;
    };
  }>;
  recentBatches: Array<{
    id: string;
    toolId: string | null;
    sourceType: string;
    originalFileName: string | null;
    totalRows: number;
    status: string;
    createdAt: string;
  }>;
}

export interface AdminExportItem {
  id: string;
  batchId: string;
  fileName: string;
  rowCount: number;
  fileSize: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export interface PackageItem {
  id: string;
  name: string;
  credits: number;
  monthlyPrice: number;
  yearlyPrice: number;
  isTopLevel: boolean;
  isActive: boolean;
  isHighlighted: boolean;
  badge: string | null;
  subtitle: string | null;
  buttonText: string;
  features: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminToolItem {
  id: string;
  toolId: string;
  name: string;
  description: string | null;
  creditCost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  listUsers() {
    return request<{ items: AdminUserItem[] }>("/admin/users");
  },
  getUserDetail(userId: string) {
    return request<AdminUserDetail>(`/admin/users/${encodeURIComponent(userId)}`);
  },
  updateUserRole(userId: string, role: string) {
    return request<{ message: string }>(`/admin/users/${encodeURIComponent(userId)}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },
  deleteUser(userId: string) {
    return request<{ message: string }>(`/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
  },
  updateUserCredits(userId: string, credits: number) {
    return request<{ message: string; credits: number }>(`/admin/users/${encodeURIComponent(userId)}/credits`, {
      method: "PATCH",
      body: JSON.stringify({ credits }),
    });
  },
  listKeys() {
    return request<{ items: AdminKeyItem[] }>("/admin/keys");
  },
  createKey(label: string, rawKey: string) {
    return request<{ id: string }>("/admin/keys", {
      method: "POST",
      body: JSON.stringify({ label, rawKey }),
    });
  },
  setKeyActive(keyId: string, isActive: boolean) {
    return request<void>(`/admin/keys/${encodeURIComponent(keyId)}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },
  updateKeyRateLimit(keyId: string, requestsPerSecond: number) {
    return request<void>(`/admin/keys/${encodeURIComponent(keyId)}/rate-limit`, {
      method: "PATCH",
      body: JSON.stringify({ requestsPerSecond }),
    });
  },
  listAssignments(userId?: string) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return request<{ items: AssignmentItem[] }>(`/admin/assignments${qs}`);
  },
  manualAssign(userId: string, apiKeyId: string) {
    return request<void>("/admin/assignments/manual", {
      method: "POST",
      body: JSON.stringify({ userId, apiKeyId }),
    });
  },
  autoAssign(userId: string) {
    return request<AssignmentItem>("/admin/assignments/auto", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
  deactivateAssignment(assignmentId: string) {
    return request<void>(`/admin/assignments/${encodeURIComponent(assignmentId)}/deactivate`, {
      method: "PATCH",
    });
  },
  deactivateUserAssignments(userId: string) {
    return request<{ deactivated: number }>(`/admin/users/${encodeURIComponent(userId)}/assignments`, {
      method: "DELETE",
    });
  },

  // ---- Admin Activity ----
  listAllBatches(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ items: AdminBatchItem[] }>(`/admin/activity/batches${qs}`);
  },
  getBatchById(batchId: string) {
    return request<BatchItem>(`/admin/activity/batches/${encodeURIComponent(batchId)}`);
  },
  getBatchProgress(batchId: string) {
    return request<BatchProgress>(`/admin/activity/batches/${encodeURIComponent(batchId)}/status`);
  },
  listBatchJobs(batchId: string) {
    return request<{ items: Array<{ id: string; sequence: number; rowCount: number; status: string; attempts: number }> }>(`/admin/activity/batches/${encodeURIComponent(batchId)}/jobs`);
  },
  getBatchResultCounts(batchId: string) {
    return request<ResultCounts>(`/admin/activity/batches/${encodeURIComponent(batchId)}/results/counts`);
  },
  exportBatchCsv(batchId: string) {
    return request<ExportCreateResponse>(`/admin/activity/batches/${encodeURIComponent(batchId)}/export`, {
      method: "POST",
    });
  },
  listBatchExports(batchId: string) {
    return request<{ items: ExportItem[] }>(`/admin/activity/batches/${encodeURIComponent(batchId)}/exports`);
  },
  deleteExport(exportId: string) {
    return request<void>(`/admin/activity/exports/${encodeURIComponent(exportId)}`, {
      method: "DELETE",
    });
  },
  bulkDeleteExports(exportIds: string[]) {
    return request<{ deleted: number }>("/admin/activity/exports/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ exportIds }),
    });
  },
  listAllExports() {
    return request<{ items: AdminExportItem[] }>("/admin/activity/exports");
  },

  // ---- Packages ----
  listPackages() {
    return request<{ items: PackageItem[] }>("/admin/packages");
  },
  createPackage(data: { name: string; credits: number; monthlyPrice: number; yearlyPrice: number; isTopLevel?: boolean; isHighlighted?: boolean; badge?: string; subtitle?: string; buttonText?: string; features?: string[]; sortOrder?: number }) {
    return request<PackageItem>("/admin/packages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updatePackage(packageId: string, data: { name?: string; credits?: number; monthlyPrice?: number; yearlyPrice?: number; isTopLevel?: boolean; isActive?: boolean; isHighlighted?: boolean; badge?: string | null; subtitle?: string | null; buttonText?: string; features?: string[]; sortOrder?: number }) {
    return request<PackageItem>(`/admin/packages/${encodeURIComponent(packageId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deletePackage(packageId: string) {
    return request<void>(`/admin/packages/${encodeURIComponent(packageId)}`, {
      method: "DELETE",
    });
  },

  // ---- Tools ----
  listTools() {
    return request<{ items: AdminToolItem[] }>("/admin/tools");
  },
  createTool(data: { toolId: string; name: string; description?: string; creditCost?: number }) {
    return request<AdminToolItem>("/admin/tools", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateTool(id: string, data: { name?: string; description?: string | null; creditCost?: number; isActive?: boolean }) {
    return request<AdminToolItem>(`/admin/tools/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteTool(id: string) {
    return request<void>(`/admin/tools/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

// ---- Public Packages (pricing page) ----
export const packagesApi = {
  list() {
    return request<{ items: PackageItem[] }>("/packages");
  },
};

// ---- Credits ----
export const creditsApi = {
  getBalance() {
    return request<{ credits: number }>("/credits");
  },
  purchase(packageId: string) {
    return request<{ message: string; creditsAdded: number; credits: number }>("/packages/purchase", {
      method: "POST",
      body: JSON.stringify({ packageId }),
    });
  },
};

// ---- Tool Credit Cost ----
export const toolCreditApi = {
  getCreditCost(toolId: string) {
    return request<{ toolId: string; creditCost: number }>(`/tools/${encodeURIComponent(toolId)}/credit-cost`);
  },
};

// ---- Runs / History ----
export interface RunHistoryItem {
  batchId: string;
  createdAt: string;
  sourceType: string;
  totalRows: number;
  status: string;
  completedRows: number;
  failedRows: number;
}

export interface DashboardStats {
  totalBatches: number;
  activeBatches: number;
  completedBatches: number;
  failedBatches: number;
  totalRowsProcessed: number;
  totalRowsFailed: number;
  totalExports: number;
  batchesToday: number;
}

export const runsApi = {
  history(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ items: RunHistoryItem[] }>(`/runs/history${qs}`);
  },
  stats() {
    return request<DashboardStats>("/runs/stats");
  },
};

// ---- Batches ----
export interface BatchCreateResponse {
  batchId: string;
  totalRows: number;
  totalJobs: number;
}

export interface BatchItem {
  id: string;
  sourceType: string;
  originalFileName: string | null;
  totalRows: number;
  status: string;
  completedRows: number;
  failedRows: number;
  runningRows: number;
  queuedRows: number;
  createdAt: string;
}

export interface BatchProgress {
  batchId: string;
  status: string;
  totalRows: number;
  queuedRows: number;
  runningRows: number;
  completedRows: number;
  failedRows: number;
  percentageComplete: number;
  estimatedRemainingSeconds: number;
}

export interface RowResult {
  jobId: string;
  rowIndex: number | null;
  status: string;
  response: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
}

export interface ResultCounts {
  success: number;
  failure: number;
  skipped: number;
  total: number;
}

export interface ExportItem {
  id: string;
  fileName: string;
  rowCount: number;
  fileSize: number;
  createdAt: string;
}

export interface ExportCreateResponse {
  exportId: string;
  fileName: string;
  rowCount: number;
}

export const batchApi = {
  uploadCsv(file: File, toolId?: string, chunkSize?: number) {
    const formData = new FormData();
    formData.append("file", file);
    if (toolId) {
      formData.append("toolId", toolId);
    }
    if (chunkSize) {
      formData.append("chunkSize", String(chunkSize));
    }
    return requestFormData<BatchCreateResponse>("/batches/upload", formData);
  },
  pasteRows(rows: string, toolId?: string, chunkSize?: number) {
    return request<BatchCreateResponse>("/batches/paste", {
      method: "POST",
      body: JSON.stringify({ rows, toolId, chunkSize }),
    });
  },
  list(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ items: BatchItem[] }>(`/batches${qs}`);
  },
  getById(batchId: string) {
    return request<BatchItem>(`/batches/${encodeURIComponent(batchId)}`);
  },
  getProgress(batchId: string) {
    return request<BatchProgress>(`/batches/${encodeURIComponent(batchId)}/status`);
  },
  listJobs(batchId: string) {
    return request<{ items: Array<{ id: string; sequence: number; rowCount: number; status: string; attempts: number }> }>(`/batches/${encodeURIComponent(batchId)}/jobs`);
  },
  getResults(batchId: string, opts?: { status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<{ items: RowResult[]; total: number }>(`/batches/${encodeURIComponent(batchId)}/results${qs}`);
  },
  getResultCounts(batchId: string) {
    return request<ResultCounts>(`/batches/${encodeURIComponent(batchId)}/results/counts`);
  },
  exportCsv(batchId: string) {
    return request<ExportCreateResponse>(`/batches/${encodeURIComponent(batchId)}/export`, {
      method: "POST",
    });
  },
  listExports(batchId: string) {
    return request<{ items: ExportItem[] }>(`/batches/${encodeURIComponent(batchId)}/exports`);
  },
  downloadExportUrl(exportId: string) {
    return `${API_BASE}/exports/${encodeURIComponent(exportId)}/download`;
  },
  listUserExports() {
    return request<{ items: (ExportItem & { batchId: string })[] }>("/exports");
  },
  deleteExport(exportId: string) {
    return request<void>(`/exports/${encodeURIComponent(exportId)}`, {
      method: "DELETE",
    });
  },
  bulkDeleteExports(exportIds: string[]) {
    return request<{ deleted: number }>("/exports/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ exportIds }),
    });
  },
};
