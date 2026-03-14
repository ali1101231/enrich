-- CreateTable
CREATE TABLE "WebsitePricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "price" TEXT NOT NULL,
    "billingPeriod" TEXT,
    "description" TEXT,
    "ctaText" TEXT,
    "ctaHref" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsitePricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsitePricingFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsitePricingFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "adminNotes" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsitePricingPlan_isActive_idx" ON "WebsitePricingPlan"("isActive");

-- CreateIndex
CREATE INDEX "WebsitePricingPlan_sortOrder_idx" ON "WebsitePricingPlan"("sortOrder");

-- CreateIndex
CREATE INDEX "WebsitePricingPlan_createdAt_idx" ON "WebsitePricingPlan"("createdAt");

-- CreateIndex
CREATE INDEX "WebsitePricingFeature_planId_idx" ON "WebsitePricingFeature"("planId");

-- CreateIndex
CREATE INDEX "WebsitePricingFeature_sortOrder_idx" ON "WebsitePricingFeature"("sortOrder");

-- CreateIndex
CREATE INDEX "WebsitePricingFeature_createdAt_idx" ON "WebsitePricingFeature"("createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_status_idx" ON "ContactSubmission"("status");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "WebsitePricingFeature" ADD CONSTRAINT "WebsitePricingFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WebsitePricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
