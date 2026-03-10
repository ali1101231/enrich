import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  WEB_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CHUNK_SIZE_DEFAULT: z.coerce.number().int().positive().default(10),
  SCHEDULER_POLL_MS: z.coerce.number().int().positive().default(1000),
  SCHEDULER_MAX_ENQUEUE: z.coerce.number().int().positive().default(50),
  PER_USER_ACTIVE_JOB_LIMIT: z.coerce.number().int().positive().default(3),
  BULLMQ_PREFIX: z.string().default("koldify"),
  JOB_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  JOB_BACKOFF_MS: z.coerce.number().int().positive().default(2000),
  JWT_SECRET: z.string().min(1),
  BLITZ_API_BASE_URL: z.string().url(),
  BLITZ_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.format());
  process.exit(1);
}
export const env = parsed.data;
