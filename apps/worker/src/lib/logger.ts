import { logLine, type StructuredLogContext } from "@koldify/shared";

const SERVICE = "worker-service";

export function logInfo(message: string, context: StructuredLogContext = {}): void {
  console.log(logLine(SERVICE, "info", message, context));
}

export function logWarn(message: string, context: StructuredLogContext = {}): void {
  console.warn(logLine(SERVICE, "warn", message, context));
}

export function logError(message: string, context: StructuredLogContext = {}): void {
  console.error(logLine(SERVICE, "error", message, context));
}
