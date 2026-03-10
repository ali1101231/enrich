import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";

export function attachAuthContext(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      req.authUser = { id: payload.userId, role: payload.role as "user" | "admin" };
    } catch {
      // Token invalid/expired – leave authUser undefined
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.authUser.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}
