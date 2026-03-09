import { logLine, type StructuredLogContext } from "@koldify/shared";

const SERVICE = "web-service";

export function logInfo(message: string, context: StructuredLogContext = {}): void {
  console.log(logLine(SERVICE, "info", message, context));
}

export function logWarn(message: string, context: StructuredLogContext = {}): void {
  console.warn(logLine(SERVICE, "warn", message, context));
}

export function logError(message: string, context: StructuredLogContext = {}): void {
  console.error(logLine(SERVICE, "error", message, context));
}

export function logDebug(message: string, context: StructuredLogContext = {}): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug(logLine(SERVICE, "debug", message, context));
  }
}
