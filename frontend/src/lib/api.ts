const configuredApiBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
const API_BASE = configuredApiBase
  ? configuredApiBase.endsWith("/api")
    ? configuredApiBase
    : `${configuredApiBase}/api`
  : "/api";

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
  sendOtp(email: string) {
    return request<{ ok: boolean; cooldownSeconds?: number }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  verifyOtp(email: string, otp: string) {
    return request<{ ok: boolean }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },
  completeRegister(email: string, password: string, displayName: string) {
    return request<AuthResponse>("/auth/complete-register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
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

export interface AdminOfferItem {
  id: string;
  title: string;
  description: string | null;
  credits: number;
  maxRedemptions: number;
  redeemedCount: number;
  remainingRedemptions: number;
  redemptionCount: number;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  credits: number;
  maxRedemptions: number;
  redeemedCount: number;
  remainingRedemptions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasRedeemed: boolean;
  redeemedAt: string | null;
  isSoldOut: boolean;
}

export interface AdminGuideItem {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}

export interface GuideItem {
  id: string;
  title: string;
  content: string;
  videoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}

export interface AdminNewsItem {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}

export interface AdminWebsiteLogoItem {
  id: string;
  name: string;
  imageUrl: string;
  altText: string | null;
  href: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWebsiteTestimonialItem {
  id: string;
  clientName: string;
  clientRole: string | null;
  companyName: string | null;
  quote: string;
  avatarUrl: string | null;
  rating: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWebsiteFaqItem {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWebsitePricingFeatureItem {
  id: string;
  planId: string;
  text: string;
  isIncluded: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWebsitePricingPlanItem {
  id: string;
  name: string;
  subtitle: string | null;
  price: string;
  billingPeriod: string | null;
  description: string | null;
  ctaText: string | null;
  ctaHref: string | null;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  features: AdminWebsitePricingFeatureItem[];
}

export type ContactSubmissionStatus = "new" | "replied" | "closed";

export interface ContactSubmissionItem {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactSubmissionStatus;
  adminNotes: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    displayName: string | null;
  } | null;
}

export type SupportTicketStatus = "OPEN" | "CLOSED";
export type SupportMessageSenderRole = "USER" | "ADMIN";

export interface SupportTicketMessageItem {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: SupportMessageSenderRole;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
  };
}

export interface SupportTicketItem {
  id: string;
  userId: string;
  subject: string;
  status: SupportTicketStatus;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  messages: SupportTicketMessageItem[];
}

export const adminApi = {
  getUsage() {
    return request<AdminUsageSummary>("/admin/usage");
  },
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

  // ---- Offers ----
  listOffers() {
    return request<{ items: AdminOfferItem[] }>("/admin/offers");
  },
  createOffer(data: { title: string; description?: string; credits: number; maxRedemptions: number; isActive?: boolean }) {
    return request<AdminOfferItem>("/admin/offers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateOffer(offerId: string, data: { title?: string; description?: string | null; credits?: number; maxRedemptions?: number; isActive?: boolean }) {
    return request<AdminOfferItem>(`/admin/offers/${encodeURIComponent(offerId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteOffer(offerId: string) {
    return request<void>(`/admin/offers/${encodeURIComponent(offerId)}`, {
      method: "DELETE",
    });
  },

  // ---- Guides ----
  listGuides() {
    return request<{ items: AdminGuideItem[] }>("/admin/guides");
  },
  createGuide(data: { title: string; content: string; videoUrl?: string; isActive?: boolean }) {
    return request<AdminGuideItem>("/admin/guides", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateGuide(guideId: string, data: { title?: string; content?: string; videoUrl?: string | null; isActive?: boolean }) {
    return request<AdminGuideItem>(`/admin/guides/${encodeURIComponent(guideId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteGuide(guideId: string) {
    return request<void>(`/admin/guides/${encodeURIComponent(guideId)}`, {
      method: "DELETE",
    });
  },

  // ---- News ----
  listNews() {
    return request<{ items: AdminNewsItem[] }>("/admin/news");
  },
  createNews(data: { title: string; content: string; isActive?: boolean }) {
    return request<AdminNewsItem>("/admin/news", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateNews(newsId: string, data: { title?: string; content?: string; isActive?: boolean }) {
    return request<AdminNewsItem>(`/admin/news/${encodeURIComponent(newsId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteNews(newsId: string) {
    return request<void>(`/admin/news/${encodeURIComponent(newsId)}`, {
      method: "DELETE",
    });
  },

  // ---- Website Logos ----
  listWebsiteLogos() {
    return request<{ items: AdminWebsiteLogoItem[] }>("/admin/website/logos");
  },
  createWebsiteLogo(data: { name: string; imageUrl: string; altText?: string | null; href?: string | null; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsiteLogoItem>("/admin/website/logos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateWebsiteLogo(logoId: string, data: { name?: string; imageUrl?: string; altText?: string | null; href?: string | null; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsiteLogoItem>(`/admin/website/logos/${encodeURIComponent(logoId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteWebsiteLogo(logoId: string) {
    return request<void>(`/admin/website/logos/${encodeURIComponent(logoId)}`, {
      method: "DELETE",
    });
  },

  // ---- Website Testimonials ----
  listWebsiteTestimonials() {
    return request<{ items: AdminWebsiteTestimonialItem[] }>("/admin/website/testimonials");
  },
  createWebsiteTestimonial(data: { clientName: string; clientRole?: string | null; companyName?: string | null; quote: string; avatarUrl?: string | null; rating?: number | null; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsiteTestimonialItem>("/admin/website/testimonials", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateWebsiteTestimonial(testimonialId: string, data: { clientName?: string; clientRole?: string | null; companyName?: string | null; quote?: string; avatarUrl?: string | null; rating?: number | null; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsiteTestimonialItem>(`/admin/website/testimonials/${encodeURIComponent(testimonialId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteWebsiteTestimonial(testimonialId: string) {
    return request<void>(`/admin/website/testimonials/${encodeURIComponent(testimonialId)}`, {
      method: "DELETE",
    });
  },

  // ---- Website FAQs ----
  listWebsiteFaqs() {
    return request<{ items: AdminWebsiteFaqItem[] }>("/admin/website/faqs");
  },
  createWebsiteFaq(data: { question: string; answer: string; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsiteFaqItem>("/admin/website/faqs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateWebsiteFaq(faqId: string, data: { question?: string; answer?: string; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsiteFaqItem>(`/admin/website/faqs/${encodeURIComponent(faqId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteWebsiteFaq(faqId: string) {
    return request<void>(`/admin/website/faqs/${encodeURIComponent(faqId)}`, {
      method: "DELETE",
    });
  },

  // ---- Website Pricing ----
  listWebsitePricingPlans() {
    return request<{ items: AdminWebsitePricingPlanItem[] }>("/admin/website/pricing");
  },
  createWebsitePricingPlan(data: { name: string; subtitle?: string | null; price: string; billingPeriod?: string | null; description?: string | null; ctaText?: string | null; ctaHref?: string | null; isPopular?: boolean; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsitePricingPlanItem>("/admin/website/pricing", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateWebsitePricingPlan(planId: string, data: { name?: string; subtitle?: string | null; price?: string; billingPeriod?: string | null; description?: string | null; ctaText?: string | null; ctaHref?: string | null; isPopular?: boolean; isActive?: boolean; sortOrder?: number }) {
    return request<AdminWebsitePricingPlanItem>(`/admin/website/pricing/${encodeURIComponent(planId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteWebsitePricingPlan(planId: string) {
    return request<void>(`/admin/website/pricing/${encodeURIComponent(planId)}`, {
      method: "DELETE",
    });
  },
  createWebsitePricingFeature(planId: string, data: { text: string; isIncluded?: boolean; sortOrder?: number }) {
    return request<AdminWebsitePricingFeatureItem>(`/admin/website/pricing/${encodeURIComponent(planId)}/features`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateWebsitePricingFeature(featureId: string, data: { text?: string; isIncluded?: boolean; sortOrder?: number }) {
    return request<AdminWebsitePricingFeatureItem>(`/admin/website/pricing/features/${encodeURIComponent(featureId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteWebsitePricingFeature(featureId: string) {
    return request<void>(`/admin/website/pricing/features/${encodeURIComponent(featureId)}`, {
      method: "DELETE",
    });
  },

  // ---- Support ----
  listSupportTickets() {
    return request<{ items: SupportTicketItem[] }>("/admin/support/tickets");
  },
  replySupportTicket(ticketId: string, message: string) {
    return request<SupportTicketItem>(`/admin/support/tickets/${encodeURIComponent(ticketId)}/replies`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
  updateSupportTicketStatus(ticketId: string, status: SupportTicketStatus) {
    return request<SupportTicketItem>(`/admin/support/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // ---- Contact Submissions ----
  listContactSubmissions() {
    return request<{ items: ContactSubmissionItem[] }>("/admin/contact-submissions");
  },
  getContactSubmissionById(submissionId: string) {
    return request<ContactSubmissionItem>(`/admin/contact-submissions/${encodeURIComponent(submissionId)}`);
  },
  updateContactSubmissionStatus(submissionId: string, status: ContactSubmissionStatus) {
    return request<ContactSubmissionItem>(`/admin/contact-submissions/${encodeURIComponent(submissionId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  updateContactSubmissionNotes(submissionId: string, adminNotes: string | null) {
    return request<ContactSubmissionItem>(`/admin/contact-submissions/${encodeURIComponent(submissionId)}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ adminNotes }),
    });
  },
  markContactSubmissionReplied(submissionId: string) {
    return request<ContactSubmissionItem>(`/admin/contact-submissions/${encodeURIComponent(submissionId)}/replied`, {
      method: "PATCH",
    });
  },
  deleteContactSubmission(submissionId: string) {
    return request<void>(`/admin/contact-submissions/${encodeURIComponent(submissionId)}`, {
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

// ---- Offers ----
export const offersApi = {
  list() {
    return request<{ items: OfferItem[] }>("/offers");
  },
  avail(offerId: string) {
    return request<{ message: string; offerId: string; offerTitle: string; creditsAdded: number; credits: number; redemption: { id: string; createdAt: string; credits: number } }>(`/offers/${encodeURIComponent(offerId)}/avail`, {
      method: "POST",
    });
  },
};

// ---- Guides ----
export const guidesApi = {
  list() {
    return request<{ items: GuideItem[] }>("/guides");
  },
};

// ---- News ----
export const newsApi = {
  list() {
    return request<{ items: NewsItem[] }>("/news");
  },
};

// ---- Support ----
export const supportApi = {
  listTickets() {
    return request<{ items: SupportTicketItem[] }>("/support/tickets");
  },
  createTicket(data: { subject: string; message: string }) {
    return request<SupportTicketItem>("/support/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  replyTicket(ticketId: string, message: string) {
    return request<SupportTicketItem>(`/support/tickets/${encodeURIComponent(ticketId)}/replies`, {
      method: "POST",
      body: JSON.stringify({ message }),
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

export interface UsageToolItem {
  toolId: string;
  toolName: string;
  totalRows: number;
  totalBatches: number;
  creditsUsed: number;
}

export interface UsageDailyPoint {
  date: string;
  creditsUsed: number;
  rowsProcessed: number;
}

export interface UserUsageSummary {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    credits: number;
  };
  totals: {
    totalBatches: number;
    totalRows: number;
    creditsUsed: number;
  };
  toolUsage: UsageToolItem[];
  dailyUsage: UsageDailyPoint[];
}

export interface AdminUsageUserSummary {
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  credits: number;
  totalBatches: number;
  totalRows: number;
  creditsUsed: number;
  toolUsage: UsageToolItem[];
}

export interface AdminUsageSummary {
  totals: {
    totalUsers: number;
    activeUsers: number;
    totalBatches: number;
    totalRows: number;
    creditsUsed: number;
    currentCredits: number;
  };
  topTools: Array<
    UsageToolItem & {
      activeUsers: number;
    }
  >;
  users: AdminUsageUserSummary[];
  dailyUsage: UsageDailyPoint[];
}

export const runsApi = {
  history(limit?: number) {
    const qs = limit ? `?limit=${limit}` : "";
    return request<{ items: RunHistoryItem[] }>(`/runs/history${qs}`);
  },
  stats() {
    return request<DashboardStats>("/runs/stats");
  },
  usage() {
    return request<UserUsageSummary>("/runs/usage");
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
