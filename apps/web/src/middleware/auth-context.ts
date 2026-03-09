import type { NextFunction, Request, Response } from "express";

export function attachAuthContext(req: Request, _res: Response, next: NextFunction): void {
  const userId = String(req.header("x-user-id") ?? "demo-user");
  const roleHeader = String(req.header("x-role") ?? "user").toLowerCase();
  const role = roleHeader === "admin" ? "admin" : "user";
  req.authUser = { id: userId, role };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser || req.authUser.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}
