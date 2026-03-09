import type { BatchProgressResponse } from "@koldify/shared";

export const sampleBatchProgressResponse: BatchProgressResponse = {
  batchId: "batch_cxy123",
  status: "RUNNING",
  totalRows: 250,
  queuedRows: 120,
  runningRows: 20,
  completedRows: 100,
  failedRows: 10,
  percentageComplete: 44,
  estimatedRemainingSeconds: 95,
};
