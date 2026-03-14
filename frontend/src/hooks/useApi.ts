import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  batchApi,
  runsApi,
  adminApi,
  packagesApi,
  creditsApi,
  offersApi,
  guidesApi,
  newsApi,
  supportApi,
  toolCreditApi,
  type AuthUser,
  type BatchItem,
  type BatchProgress,
  type RunHistoryItem,
  type DashboardStats,
  type AdminUserItem,
  type AdminKeyItem,
  type AdminBatchItem,
  type AdminUserDetail,
  type AssignmentItem,
  type RowResult,
  type ResultCounts,
  type ExportItem,
  type AdminExportItem,
  type PackageItem,
  type AdminToolItem,
  type AdminOfferItem,
  type OfferItem,
  type AdminGuideItem,
  type GuideItem,
  type AdminNewsItem,
  type NewsItem,
  type AdminWebsiteLogoItem,
  type AdminWebsiteTestimonialItem,
  type AdminWebsiteFaqItem,
  type AdminWebsitePricingPlanItem,
  type SupportTicketItem,
  type SupportTicketStatus,
  type ContactSubmissionItem,
  type ContactSubmissionStatus,
  type UserUsageSummary,
  type AdminUsageSummary,
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

export function useDeleteExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exportId: string) => batchApi.deleteExport(exportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-exports"] });
      qc.invalidateQueries({ queryKey: ["batch-exports"] });
    },
  });
}

export function useBulkDeleteExports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exportIds: string[]) => batchApi.bulkDeleteExports(exportIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-exports"] });
      qc.invalidateQueries({ queryKey: ["batch-exports"] });
    },
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

export function useUsageSummary(userId: string | undefined) {
  return useQuery<UserUsageSummary>({
    queryKey: ["runs", "usage", userId],
    queryFn: () => runsApi.usage(),
    enabled: !!userId,
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

export function useAdminUserDetail(userId: string | undefined) {
  return useQuery<AdminUserDetail>({
    queryKey: ["admin", "user-detail", userId],
    queryFn: () => adminApi.getUserDetail(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useAdminUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "user-detail"] });
    },
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminUpdateUserCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, credits }: { userId: string; credits: number }) =>
      adminApi.updateUserCredits(userId, credits),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "user-detail"] });
    },
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

export function useAdminUpdateKeyRateLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, requestsPerSecond }: { keyId: string; requestsPerSecond: number }) =>
      adminApi.updateKeyRateLimit(keyId, requestsPerSecond),
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
      qc.invalidateQueries({ queryKey: ["admin", "user-detail"] });
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
      qc.invalidateQueries({ queryKey: ["admin", "user-detail"] });
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
      qc.invalidateQueries({ queryKey: ["admin", "user-detail"] });
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
      qc.invalidateQueries({ queryKey: ["admin", "user-detail"] });
    },
  });
}

// ---- Admin: Activity (all batches) ----
export function useAdminAllBatches(limit?: number) {
  return useQuery<AdminBatchItem[]>({
    queryKey: ["admin", "activity", "batches", limit],
    queryFn: async () => {
      const res = await adminApi.listAllBatches(limit);
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useAdminUsageSummary() {
  return useQuery<AdminUsageSummary>({
    queryKey: ["admin", "usage"],
    queryFn: () => adminApi.getUsage(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAdminBatchDetail(batchId: string | undefined) {
  return useQuery<BatchItem>({
    queryKey: ["admin", "activity", "batch", batchId],
    queryFn: () => adminApi.getBatchById(batchId!),
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

export function useAdminBatchProgress(batchId: string | undefined) {
  return useQuery<BatchProgress>({
    queryKey: ["admin", "activity", "batch-progress", batchId],
    queryFn: () => adminApi.getBatchProgress(batchId!),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000;
      if (data.status === "COMPLETED" || data.status === "FAILED") return false;
      return 3000;
    },
    staleTime: 2000,
  });
}

export function useAdminBatchJobs(batchId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "activity", "batch-jobs", batchId],
    queryFn: () => adminApi.listBatchJobs(batchId!),
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

export function useAdminBatchResultCounts(batchId: string | undefined) {
  return useQuery<ResultCounts>({
    queryKey: ["admin", "activity", "batch-result-counts", batchId],
    queryFn: () => adminApi.getBatchResultCounts(batchId!),
    enabled: !!batchId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useAdminBatchExports(batchId: string | undefined) {
  return useQuery<ExportItem[]>({
    queryKey: ["admin", "activity", "batch-exports", batchId],
    queryFn: async () => {
      const res = await adminApi.listBatchExports(batchId!);
      return res.items;
    },
    enabled: !!batchId,
    staleTime: 10_000,
  });
}

export function useAdminExportCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => adminApi.exportBatchCsv(batchId),
    onSuccess: (_data, batchId) => {
      qc.invalidateQueries({ queryKey: ["admin", "activity", "batch-exports", batchId] });
      qc.invalidateQueries({ queryKey: ["admin", "all-exports"] });
    },
  });
}

export function useAdminAllExports() {
  return useQuery<AdminExportItem[]>({
    queryKey: ["admin", "all-exports"],
    queryFn: async () => {
      const res = await adminApi.listAllExports();
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useAdminDeleteExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exportId: string) => adminApi.deleteExport(exportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "all-exports"] });
      qc.invalidateQueries({ queryKey: ["admin", "activity", "batch-exports"] });
    },
  });
}

export function useAdminBulkDeleteExports() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exportIds: string[]) => adminApi.bulkDeleteExports(exportIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "all-exports"] });
      qc.invalidateQueries({ queryKey: ["admin", "activity", "batch-exports"] });
    },
  });
}

// ---- Admin: Packages ----
export function useAdminPackages() {
  return useQuery<PackageItem[]>({
    queryKey: ["admin", "packages"],
    queryFn: async () => {
      const res = await adminApi.listPackages();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; credits: number; monthlyPrice: number; yearlyPrice: number; isTopLevel?: boolean; isHighlighted?: boolean; badge?: string; subtitle?: string; buttonText?: string; features?: string[]; sortOrder?: number }) =>
      adminApi.createPackage(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "packages"] }),
  });
}

export function useAdminUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: { name?: string; credits?: number; monthlyPrice?: number; yearlyPrice?: number; isTopLevel?: boolean; isActive?: boolean; isHighlighted?: boolean; badge?: string | null; subtitle?: string | null; buttonText?: string; features?: string[]; sortOrder?: number } }) =>
      adminApi.updatePackage(packageId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "packages"] }),
  });
}

export function useAdminDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) => adminApi.deletePackage(packageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "packages"] }),
  });
}

// ---- Admin: Tools ----
export function useAdminTools() {
  return useQuery<AdminToolItem[]>({
    queryKey: ["admin", "tools"],
    queryFn: async () => {
      const res = await adminApi.listTools();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { toolId: string; name: string; description?: string; creditCost?: number }) =>
      adminApi.createTool(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tools"] }),
  });
}

export function useAdminUpdateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string | null; creditCost?: number; isActive?: boolean } }) =>
      adminApi.updateTool(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tools"] }),
  });
}

export function useAdminDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTool(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tools"] }),
  });
}

// ---- Admin: Offers ----
export function useAdminOffers() {
  return useQuery<AdminOfferItem[]>({
    queryKey: ["admin", "offers"],
    queryFn: async () => {
      const res = await adminApi.listOffers();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; credits: number; maxRedemptions: number; isActive?: boolean }) =>
      adminApi.createOffer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "offers"] }),
  });
}

export function useAdminUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: { title?: string; description?: string | null; credits?: number; maxRedemptions?: number; isActive?: boolean } }) =>
      adminApi.updateOffer(offerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "offers"] }),
  });
}

export function useAdminDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => adminApi.deleteOffer(offerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "offers"] }),
  });
}

// ---- Admin: Guides ----
export function useAdminGuides() {
  return useQuery<AdminGuideItem[]>({
    queryKey: ["admin", "guides"],
    queryFn: async () => {
      const res = await adminApi.listGuides();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; videoUrl?: string; isActive?: boolean }) =>
      adminApi.createGuide(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "guides"] }),
  });
}

export function useAdminUpdateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guideId, data }: { guideId: string; data: { title?: string; content?: string; videoUrl?: string | null; isActive?: boolean } }) =>
      adminApi.updateGuide(guideId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "guides"] }),
  });
}

export function useAdminDeleteGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guideId: string) => adminApi.deleteGuide(guideId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "guides"] }),
  });
}

// ---- Admin: News ----
export function useAdminNews() {
  return useQuery<AdminNewsItem[]>({
    queryKey: ["admin", "news"],
    queryFn: async () => {
      const res = await adminApi.listNews();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; isActive?: boolean }) =>
      adminApi.createNews(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "news"] }),
  });
}

export function useAdminUpdateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ newsId, data }: { newsId: string; data: { title?: string; content?: string; isActive?: boolean } }) =>
      adminApi.updateNews(newsId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "news"] }),
  });
}

export function useAdminDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newsId: string) => adminApi.deleteNews(newsId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "news"] }),
  });
}

// ---- Admin: Website Logos ----
export function useAdminWebsiteLogos() {
  return useQuery<AdminWebsiteLogoItem[]>({
    queryKey: ["admin", "website", "logos"],
    queryFn: async () => {
      const res = await adminApi.listWebsiteLogos();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateWebsiteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; imageUrl: string; altText?: string | null; href?: string | null; isActive?: boolean; sortOrder?: number }) =>
      adminApi.createWebsiteLogo(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "logos"] }),
  });
}

export function useAdminUpdateWebsiteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ logoId, data }: { logoId: string; data: { name?: string; imageUrl?: string; altText?: string | null; href?: string | null; isActive?: boolean; sortOrder?: number } }) =>
      adminApi.updateWebsiteLogo(logoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "logos"] }),
  });
}

export function useAdminDeleteWebsiteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logoId: string) => adminApi.deleteWebsiteLogo(logoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "logos"] }),
  });
}

// ---- Admin: Website Testimonials ----
export function useAdminWebsiteTestimonials() {
  return useQuery<AdminWebsiteTestimonialItem[]>({
    queryKey: ["admin", "website", "testimonials"],
    queryFn: async () => {
      const res = await adminApi.listWebsiteTestimonials();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateWebsiteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { clientName: string; clientRole?: string | null; companyName?: string | null; quote: string; avatarUrl?: string | null; rating?: number | null; isActive?: boolean; sortOrder?: number }) =>
      adminApi.createWebsiteTestimonial(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "testimonials"] }),
  });
}

export function useAdminUpdateWebsiteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ testimonialId, data }: { testimonialId: string; data: { clientName?: string; clientRole?: string | null; companyName?: string | null; quote?: string; avatarUrl?: string | null; rating?: number | null; isActive?: boolean; sortOrder?: number } }) =>
      adminApi.updateWebsiteTestimonial(testimonialId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "testimonials"] }),
  });
}

export function useAdminDeleteWebsiteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testimonialId: string) => adminApi.deleteWebsiteTestimonial(testimonialId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "testimonials"] }),
  });
}

// ---- Admin: Website FAQs ----
export function useAdminWebsiteFaqs() {
  return useQuery<AdminWebsiteFaqItem[]>({
    queryKey: ["admin", "website", "faqs"],
    queryFn: async () => {
      const res = await adminApi.listWebsiteFaqs();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateWebsiteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { question: string; answer: string; isActive?: boolean; sortOrder?: number }) =>
      adminApi.createWebsiteFaq(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "faqs"] }),
  });
}

export function useAdminUpdateWebsiteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ faqId, data }: { faqId: string; data: { question?: string; answer?: string; isActive?: boolean; sortOrder?: number } }) =>
      adminApi.updateWebsiteFaq(faqId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "faqs"] }),
  });
}

export function useAdminDeleteWebsiteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (faqId: string) => adminApi.deleteWebsiteFaq(faqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "faqs"] }),
  });
}

// ---- Admin: Website Pricing ----
export function useAdminWebsitePricingPlans() {
  return useQuery<AdminWebsitePricingPlanItem[]>({
    queryKey: ["admin", "website", "pricing"],
    queryFn: async () => {
      const res = await adminApi.listWebsitePricingPlans();
      return res.items;
    },
    staleTime: 30_000,
  });
}

export function useAdminCreateWebsitePricingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; subtitle?: string | null; price: string; billingPeriod?: string | null; description?: string | null; ctaText?: string | null; ctaHref?: string | null; isPopular?: boolean; isActive?: boolean; sortOrder?: number }) =>
      adminApi.createWebsitePricingPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "pricing"] }),
  });
}

export function useAdminUpdateWebsitePricingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: { name?: string; subtitle?: string | null; price?: string; billingPeriod?: string | null; description?: string | null; ctaText?: string | null; ctaHref?: string | null; isPopular?: boolean; isActive?: boolean; sortOrder?: number } }) =>
      adminApi.updateWebsitePricingPlan(planId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "pricing"] }),
  });
}

export function useAdminDeleteWebsitePricingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => adminApi.deleteWebsitePricingPlan(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "pricing"] }),
  });
}

export function useAdminCreateWebsitePricingFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: { text: string; isIncluded?: boolean; sortOrder?: number } }) =>
      adminApi.createWebsitePricingFeature(planId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "pricing"] }),
  });
}

export function useAdminUpdateWebsitePricingFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ featureId, data }: { featureId: string; data: { text?: string; isIncluded?: boolean; sortOrder?: number } }) =>
      adminApi.updateWebsitePricingFeature(featureId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "pricing"] }),
  });
}

export function useAdminDeleteWebsitePricingFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (featureId: string) => adminApi.deleteWebsitePricingFeature(featureId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "website", "pricing"] }),
  });
}

// ---- Admin: Support ----
export function useAdminSupportTickets() {
  return useQuery<SupportTicketItem[]>({
    queryKey: ["admin", "support", "tickets"],
    queryFn: async () => {
      const res = await adminApi.listSupportTickets();
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useAdminReplySupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      adminApi.replySupportTicket(ticketId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });
}

export function useAdminUpdateSupportTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) =>
      adminApi.updateSupportTicketStatus(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });
}

// ---- Admin: Contact Submissions ----
export function useAdminContactSubmissions() {
  return useQuery<ContactSubmissionItem[]>({
    queryKey: ["admin", "contact-submissions"],
    queryFn: async () => {
      const res = await adminApi.listContactSubmissions();
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useAdminContactSubmission(submissionId: string | undefined) {
  return useQuery<ContactSubmissionItem>({
    queryKey: ["admin", "contact-submission", submissionId],
    queryFn: () => adminApi.getContactSubmissionById(submissionId!),
    enabled: !!submissionId,
    staleTime: 10_000,
  });
}

export function useAdminUpdateContactSubmissionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, status }: { submissionId: string; status: ContactSubmissionStatus }) =>
      adminApi.updateContactSubmissionStatus(submissionId, status),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "contact-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "contact-submission", vars.submissionId] });
    },
  });
}

export function useAdminUpdateContactSubmissionNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, adminNotes }: { submissionId: string; adminNotes: string | null }) =>
      adminApi.updateContactSubmissionNotes(submissionId, adminNotes),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "contact-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "contact-submission", vars.submissionId] });
    },
  });
}

export function useAdminMarkContactSubmissionReplied() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) => adminApi.markContactSubmissionReplied(submissionId),
    onSuccess: (_data, submissionId) => {
      qc.invalidateQueries({ queryKey: ["admin", "contact-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "contact-submission", submissionId] });
    },
  });
}

export function useAdminDeleteContactSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) => adminApi.deleteContactSubmission(submissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "contact-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin", "contact-submission"] });
    },
  });
}

// ---- Tool Credit Cost (for users) ----
export function useToolCreditCost(toolId: string | undefined) {
  return useQuery<number>({
    queryKey: ["tool-credit-cost", toolId],
    queryFn: async () => {
      const res = await toolCreditApi.getCreditCost(toolId!);
      return res.creditCost;
    },
    enabled: !!toolId,
    staleTime: 60_000,
  });
}

// ---- Public: Packages (pricing page) ----
export function usePackages() {
  return useQuery<PackageItem[]>({
    queryKey: ["packages"],
    queryFn: async () => {
      const res = await packagesApi.list();
      return res.items;
    },
    staleTime: 60_000,
  });
}

// ---- Credits ----
export function useCredits() {
  return useQuery<number>({
    queryKey: ["credits"],
    queryFn: async () => {
      const res = await creditsApi.getBalance();
      return res.credits;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function usePurchasePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) => creditsApi.purchase(packageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

// ---- Offers ----
export function useOffers() {
  return useQuery<OfferItem[]>({
    queryKey: ["offers"],
    queryFn: async () => {
      const res = await offersApi.list();
      return res.items;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useAvailOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => offersApi.avail(offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

// ---- Guides ----
export function useGuides() {
  return useQuery<GuideItem[]>({
    queryKey: ["guides"],
    queryFn: async () => {
      const res = await guidesApi.list();
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

// ---- News ----
export function useNews() {
  return useQuery<NewsItem[]>({
    queryKey: ["news"],
    queryFn: async () => {
      const res = await newsApi.list();
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

// ---- Support ----
export function useSupportTickets() {
  return useQuery<SupportTicketItem[]>({
    queryKey: ["support", "tickets"],
    queryFn: async () => {
      const res = await supportApi.listTickets();
      return res.items;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subject: string; message: string }) => supportApi.createTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });
}

export function useReplySupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      supportApi.replyTicket(ticketId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      qc.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });
}
