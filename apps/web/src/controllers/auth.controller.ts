import { z } from "zod";
import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/auth.service.js";
import { OtpService } from "../services/otp.service.js";
import { EmailService } from "../services/email.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const sendOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

const completeRegisterSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  password: z.string().min(6),
});

export class AuthController {
  constructor(
    private readonly service = new AuthService(),
    private readonly otpService = new OtpService(),
    private readonly emailService = new EmailService(),
  ) {}

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

  sendOtp = async (req: Request, res: Response): Promise<void> => {
    const { email } = sendOtpSchema.parse(req.body);

    // Reject if email is already registered
    const existing = await this.service.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: "This email is already registered. Please log in." });
      return;
    }

    const { otp, cooldownSeconds } = await this.otpService.generate(email);
    if (cooldownSeconds > 0) {
      res.status(429).json({
        error: `Please wait ${cooldownSeconds}s before requesting a new code.`,
        cooldownSeconds,
      });
      return;
    }

    try {
      await this.emailService.sendOtp(email, otp);
    } catch (err) {
      // Still log to console in development so devs can test without SendGrid
      const nodeEnv = process.env["NODE_ENV"] ?? "development";
      if (nodeEnv !== "production") {
        console.log(`[DEV] OTP for ${email}: ${otp}`);
      } else {
        throw err;
      }
    }

    res.status(200).json({ ok: true });
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = verifyOtpSchema.parse(req.body);

    const valid = await this.otpService.verify(email, otp);
    if (!valid) {
      res.status(422).json({ error: "Invalid or expired code. Please try again." });
      return;
    }

    res.status(200).json({ ok: true });
  };

  completeRegister = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, displayName, password } = completeRegisterSchema.parse(req.body);

      const verified = await this.otpService.isVerified(email);
      if (!verified) {
        res.status(403).json({ error: "Email not verified. Please restart the signup flow." });
        return;
      }

      const result = await this.service.register(email, password, displayName);

      // Consume the verified flag so it can't be reused
      await this.otpService.consumeVerified(email);

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      throw error;
    }
  };
}

