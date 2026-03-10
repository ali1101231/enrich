import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  BULLMQ_PREFIX: z.string().default("koldify"),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(10),
  JOB_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  BLITZ_API_BASE_URL: z.string().url(),
  BLITZ_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.format());
  process.exit(1);
}
export const env = parsed.data;
