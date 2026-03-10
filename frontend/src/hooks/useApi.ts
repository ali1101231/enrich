import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  batchApi,
  runsApi,
  adminApi,
  type AuthUser,
  type BatchItem,
  type BatchProgress,
  type RunHistoryItem,
  type DashboardStats,
  type AdminUserItem,
  type AdminKeyItem,
  type AssignmentItem,
  type RowResult,
  type ResultCounts,
  type ExportItem,
} from "@/lib/api";

// ---- Auth ----
export function useAuthMe(enabled = true) {
  return useQuery<AuthUser>({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

// ---- Batches (user) ----
export function useBatches(limit?: number) {
  return useQuery<BatchItem[]>({
    queryKey: ["batches", limit],
    queryFn: async () => {
      const res = await batchApi.list(limit);
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useBatchProgress(batchId: string | undefined, enabled = true) {
  return useQuery<BatchProgress>({
    queryKey: ["batch-progress", batchId],
    queryFn: () => batchApi.getProgress(batchId!),
    enabled: !!batchId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000;
      if (data.status === "COMPLETED" || data.status === "FAILED") return false;
      return 3000;
    },
    staleTime: 2000,
  });
}

export function useBatchDetail(batchId: string | undefined) {
  return useQuery<BatchItem>({
    queryKey: ["batch", batchId],
    queryFn: () => batchApi.getById(batchId!),
    enabled: !!batchId,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000;
      if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "PARTIAL") return false;
      return 5000;
    },
  });
}

export function useBatchJobs(batchId: string | undefined) {
  return useQuery({
    queryKey: ["batch-jobs", batchId],
    queryFn: () => batchApi.listJobs(batchId!),
    enabled: !!batchId,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000;
      const allDone = data.items.every(
        (j: { status: string }) => j.status === "COMPLETED" || j.status === "FAILED",
      );
      return allDone ? false : 5000;
    },
  });
}

// ---- Batch Results ----
export function useBatchResults(
  batchId: string | undefined,
  opts?: { status?: string; limit?: number; offset?: number },
) {
  return useQuery({
    queryKey: ["batch-results", batchId, opts],
    queryFn: () => batchApi.getResults(batchId!, opts),
    enabled: !!batchId,
    staleTime: 10_000,
  });
}

export function useBatchResultCounts(batchId: string | undefined) {
  return useQuery<ResultCounts>({
    queryKey: ["batch-result-counts", batchId],
    queryFn: () => batchApi.getResultCounts(batchId!),
    enabled: !!batchId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

// ---- Exports ----
export function useBatchExports(batchId: string | undefined) {
  return useQuery<ExportItem[]>({
    queryKey: ["batch-exports", batchId],
    queryFn: async () => {
      const res = await batchApi.listExports(batchId!);
      return res.items;
    },
    enabled: !!batchId,
    staleTime: 10_000,
  });
}

export function useExportCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => batchApi.exportCsv(batchId),
    onSuccess: (_data, batchId) => {
      qc.invalidateQueries({ queryKey: ["batch-exports", batchId] });
      qc.invalidateQueries({ queryKey: ["user-exports"] });
    },
  });
}

export function useUserExports() {
  return useQuery({
    queryKey: ["user-exports"],
    queryFn: async () => {
      const res = await batchApi.listUserExports();
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

// ---- Dashboard Stats ----
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => runsApi.stats(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ---- Run History ----
export function useRunHistory(limit?: number) {
  return useQuery<RunHistoryItem[]>({
    queryKey: ["runs", "history", limit],
    queryFn: async () => {
      const res = await runsApi.history(limit);
      return res.items;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ---- Admin: Users ----
export function useAdminUsers() {
  return useQuery<AdminUserItem[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await adminApi.listUsers();
      return res.items;
    },
    staleTime: 30_000,
  });
}

// ---- Admin: Keys ----
export function useAdminKeys() {
  return useQuery<AdminKeyItem[]>({
    queryKey: ["admin", "keys"],
    queryFn: async () => {
      const res = await adminApi.listKeys();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ label, rawKey }: { label: string; rawKey: string }) =>
      adminApi.createKey(label, rawKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "keys"] }),
  });
}

export function useAdminSetKeyActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, isActive }: { keyId: string; isActive: boolean }) =>
      adminApi.setKeyActive(keyId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "keys"] }),
  });
}

// ---- Admin: Assignments ----
export function useAdminAssignments(userId?: string) {
  return useQuery<AssignmentItem[]>({
    queryKey: ["admin", "assignments", userId],
    queryFn: async () => {
      const res = await adminApi.listAssignments(userId);
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminManualAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, apiKeyId }: { userId: string; apiKeyId: string }) =>
      adminApi.manualAssign(userId, apiKeyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assignments"] });
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
  });
}

export function useAdminAutoAssign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.autoAssign(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assignments"] });
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
  });
}

export function useAdminDeactivateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => adminApi.deactivateAssignment(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assignments"] });
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
  });
}

export function useAdminDeactivateUserAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.deactivateUserAssignments(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assignments"] });
      qc.invalidateQueries({ queryKey: ["admin", "keys"] });
    },
  });
}
