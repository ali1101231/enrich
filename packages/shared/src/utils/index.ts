import type { StructuredLogContext } from "../types/index.js";

export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function toPercentage(completed: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((completed / total) * 10000) / 100;
}

export function estimateRemainingSeconds(
  completedRows: number,
  totalRows: number,
  startedAt: Date,
): number {
  if (completedRows <= 0 || totalRows <= 0) {
    return 0;
  }
  const elapsedSeconds = (Date.now() - startedAt.getTime()) / 1000;
  if (elapsedSeconds <= 0) {
    return 0;
  }
  const rowsPerSecond = completedRows / elapsedSeconds;
  if (rowsPerSecond <= 0) {
    return 0;
  }
  const remainingRows = Math.max(totalRows - completedRows, 0);
  return Math.ceil(remainingRows / rowsPerSecond);
}

export function logLine(
  service: string,
  level: "info" | "warn" | "error" | "debug",
  message: string,
  context: StructuredLogContext = {},
): string {
  return JSON.stringify({
    ts: new Date().toISOString(),
    service,
    level,
    message,
    ...context,
  });
}
