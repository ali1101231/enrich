import { z } from "zod";
import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/auth.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  constructor(private readonly service = new AuthService()) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = registerSchema.parse(req.body);
      const result = await this.service.register(body.email, body.password, body.displayName);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = loginSchema.parse(req.body);
      const result = await this.service.login(body.email, body.password);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      throw error;
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.authUser?.id;
      if (!userId) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      const user = await this.service.getMe(userId);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      throw error;
    }
  };
}
