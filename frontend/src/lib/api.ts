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
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
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

export const adminApi = {
  listUsers() {
    return request<{ items: AdminUserItem[] }>("/admin/users");
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

export const runsApi = {
  history(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ items: RunHistoryItem[] }>(`/runs/history${qs}`);
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

export const batchApi = {
  uploadCsv(file: File, chunkSize?: number) {
    const formData = new FormData();
    formData.append("file", file);
    if (chunkSize) {
      formData.append("chunkSize", String(chunkSize));
    }
    return requestFormData<BatchCreateResponse>("/batches/upload", formData);
  },
  pasteRows(rows: string, chunkSize?: number) {
    return request<BatchCreateResponse>("/batches/paste", {
      method: "POST",
      body: JSON.stringify({ rows, chunkSize }),
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
};
