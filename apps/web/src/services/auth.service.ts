import { prisma } from "../prisma/client.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";

interface AuthResult {
  user: { id: string; email: string; displayName: string | null; role: string; credits: number };
  token: string;
}

interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  passwordHash: string | null;
  isActive: boolean;
}

export class AuthService {
  async findByEmail(email: string): Promise<{ id: string } | null> {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    return user;
  }

  async register(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthError("Email already registered", 409);
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash: hashed, displayName: displayName ?? null } as never,
    });

    const token = signToken({ userId: user.id, role: user.role });
    return {
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, credits: (user as any).credits ?? 0 },
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const row = (await prisma.user.findUnique({ where: { email } })) as UserRow | null;

    if (!row || !row.passwordHash) {
      throw new AuthError("Invalid email or password", 401);
    }

    if (!row.isActive) {
      throw new AuthError("Account is deactivated", 403);
    }

    const valid = await verifyPassword(password, row.passwordHash);
    if (!valid) {
      throw new AuthError("Invalid email or password", 401);
    }

    const token = signToken({ userId: row.id, role: row.role });
    return {
      user: { id: row.id, email: row.email, displayName: row.displayName, role: row.role, credits: (row as any).credits ?? 0 },
      token,
    };
  }

  async getMe(userId: string): Promise<{ id: string; email: string; displayName: string | null; role: string; credits: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true, role: true, isActive: true, credits: true },
    });

    if (!user || !user.isActive) {
      throw new AuthError("User not found", 404);
    }

    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, credits: user.credits };
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
