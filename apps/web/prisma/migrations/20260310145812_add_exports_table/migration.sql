-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "r2Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exports_batchId_idx" ON "exports"("batchId");

-- CreateIndex
CREATE INDEX "exports_userId_createdAt_idx" ON "exports"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
