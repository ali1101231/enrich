export const sampleApiRoutes = {
  uploadCsv: "POST /api/batches/upload (multipart/form-data, file=<csv>)",
  pasteRows: "POST /api/batches/paste { rows: string, chunkSize?: number }",
  batchStatus: "GET /api/batches/:batchId/status",
  runHistory: "GET /api/runs/history?limit=20",
  createApiKey: "POST /api/admin/keys { label: string, rawKey: string }",
  setApiKeyActive: "PATCH /api/admin/keys/:keyId/active { isActive: boolean }",
  manualAssign: "POST /api/admin/assignments/manual { userId: string, apiKeyId: string }",
  autoAssign: "POST /api/admin/assignments/auto { userId: string }",
};
