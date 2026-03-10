import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { logError } from "../lib/logger.js";

export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId;

  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      requestId,
    });
    return;
  }

  if (error instanceof MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: error.message, requestId });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  logError("Unhandled request error", {
    requestId,
    path: req.path,
    method: req.method,
    message,
  });
  res.status(500).json({ error: message, requestId });
}
