import { redis } from "../lib/redis.js";

const OTP_TTL = 600;        // 10 minutes
const VERIFIED_TTL = 900;   // 15 minutes
const RATE_LIMIT_TTL = 60;  // 1-minute cooldown between resends

export class OtpService {
  private otpKey(email: string) {
    return `otp:${email.toLowerCase()}`;
  }

  private verifiedKey(email: string) {
    return `otp-verified:${email.toLowerCase()}`;
  }

  private rateKey(email: string) {
    return `otp-rate:${email.toLowerCase()}`;
  }

  /** Generate and store an OTP. Returns null if still in cooldown (with remaining seconds). */
  async generate(email: string): Promise<{ otp: string; cooldownSeconds: number }> {
    const rateKey = this.rateKey(email);
    const ttl = await redis.ttl(rateKey);
    if (ttl > 0) {
      return { otp: "", cooldownSeconds: ttl };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = this.otpKey(email);

    await redis.set(key, otp, "EX", OTP_TTL);
    await redis.set(rateKey, "1", "EX", RATE_LIMIT_TTL);

    return { otp, cooldownSeconds: 0 };
  }

  /** Verify an OTP. On success, atomically moves to verified state. */
  async verify(email: string, otp: string): Promise<boolean> {
    const key = this.otpKey(email);
    const stored = await redis.get(key);

    if (!stored || stored !== otp.trim()) {
      return false;
    }

    // Valid — delete OTP and stamp email as verified for registration step
    await redis.del(key);
    await redis.set(this.verifiedKey(email), "1", "EX", VERIFIED_TTL);
    return true;
  }

  async isVerified(email: string): Promise<boolean> {
    const val = await redis.get(this.verifiedKey(email));
    return val === "1";
  }

  /** Consume verified flag after registration (one-time use). */
  async consumeVerified(email: string): Promise<void> {
    await redis.del(this.verifiedKey(email));
  }

  async getRateLimitTtl(email: string): Promise<number> {
    return Math.max(0, await redis.ttl(this.rateKey(email)));
  }
}
