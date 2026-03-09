import type { NextFunction, Request, Response } from "express";
import { logError } from "../lib/logger.js";

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const message = error instanceof Error ? error.message : "Unexpected error";
  logError("Unhandled request error", {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    message,
  });
  res.status(500).json({ error: message, requestId: req.requestId });
}
