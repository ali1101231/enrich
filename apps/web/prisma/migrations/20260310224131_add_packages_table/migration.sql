-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "yearlyPrice" DOUBLE PRECISION NOT NULL,
    "isTopLevel" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT,
    "subtitle" TEXT,
    "buttonText" TEXT NOT NULL DEFAULT 'Get Started',
    "features" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);
