-- CreateTable
CREATE TABLE "WebsiteLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "href" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteTestimonial" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientRole" TEXT,
    "companyName" TEXT,
    "quote" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "rating" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteFaq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteFaq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsiteLogo_isActive_idx" ON "WebsiteLogo"("isActive");

-- CreateIndex
CREATE INDEX "WebsiteLogo_sortOrder_idx" ON "WebsiteLogo"("sortOrder");

-- CreateIndex
CREATE INDEX "WebsiteTestimonial_isActive_idx" ON "WebsiteTestimonial"("isActive");

-- CreateIndex
CREATE INDEX "WebsiteTestimonial_sortOrder_idx" ON "WebsiteTestimonial"("sortOrder");

-- CreateIndex
CREATE INDEX "WebsiteFaq_isActive_idx" ON "WebsiteFaq"("isActive");

-- CreateIndex
CREATE INDEX "WebsiteFaq_sortOrder_idx" ON "WebsiteFaq"("sortOrder");
