-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE INDEX "jobs_batchId_status_idx" ON "jobs"("batchId", "status");
