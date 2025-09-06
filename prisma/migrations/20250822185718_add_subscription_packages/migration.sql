-- CreateEnum
CREATE TYPE "PackageDuration" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME');

-- AlterTable
ALTER TABLE "packages" ADD COLUMN     "duration" "PackageDuration" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "activePackageId" TEXT,
ADD COLUMN     "dailySwipeRemaining" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastSwipeReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "subscription_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "dailySwipeLimit" INTEGER NOT NULL,
    "duration" "PackageDuration" NOT NULL DEFAULT 'MONTHLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_packages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_activePackageId_fkey" FOREIGN KEY ("activePackageId") REFERENCES "subscription_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
