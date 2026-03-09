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
});

export const env = envSchema.parse(process.env);
