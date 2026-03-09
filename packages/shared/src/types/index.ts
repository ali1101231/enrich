export type JobStatus =
  | "QUEUED"
  | "DISPATCHED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type BatchStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "PARTIAL" | "PAUSED";

export type UserRole = "USER" | "ADMIN";

export interface UploadRow {
  originalIndex: number;
  payload: Record<string, string>;
}

export interface JobPayload {
  jobId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface BatchProgressResponse {
  batchId: string;
  status: BatchStatus;
  totalRows: number;
  queuedRows: number;
  runningRows: number;
  completedRows: number;
  failedRows: number;
  percentageComplete: number;
  estimatedRemainingSeconds: number;
}

export interface ApiKeyCapacity {
  apiKeyId: string;
  activeUsers: number;
  maxUsers: number;
}

export interface BatchListItem {
  id: string;
  toolId: string;
  status: BatchStatus;
  totalRows: number;
  queuedRows: number;
  runningRows: number;
  completedRows: number;
  failedRows: number;
  createdAt: string;
  fileName: string | null;
}

export interface ApiKeyListItem {
  id: string;
  label: string;
  provider: "BLITZ";
  requestsPerSecond: number;
  maxUsers: number;
  isActive: boolean;
  activeUsers: number;
}

export interface StructuredLogContext {
  [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}
