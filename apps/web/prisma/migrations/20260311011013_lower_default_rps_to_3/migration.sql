-- AlterTable: lower default requestsPerSecond from 5 to 3
ALTER TABLE "api_keys" ALTER COLUMN "requestsPerSecond" SET DEFAULT 3;

-- Update existing keys that still have the old default of 5
UPDATE "api_keys" SET "requestsPerSecond" = 3 WHERE "requestsPerSecond" = 5;
