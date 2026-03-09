import pino from "pino";
import type { StructuredLogContext } from "@koldify/shared";

export const logger = pino({ name: "worker-service" });

export function logInfo(message: string, context: StructuredLogContext = {}): void {
  logger.info(context, message);
}

export function logWarn(message: string, context: StructuredLogContext = {}): void {
  logger.warn(context, message);
}

export function logError(message: string, context: StructuredLogContext = {}): void {
  logger.error(context, message);
}
