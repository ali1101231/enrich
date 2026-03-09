import "express";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        role: "user" | "admin";
      };
      requestId?: string;
    }
  }
}

export {};
