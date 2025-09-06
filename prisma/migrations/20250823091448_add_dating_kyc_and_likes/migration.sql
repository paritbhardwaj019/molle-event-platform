-- CreateEnum
CREATE TYPE "DatingKycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DatingKycDocType" AS ENUM ('AADHAAR', 'PASSPORT', 'DRIVING_LICENSE');

-- CreateTable
CREATE TABLE "dating_kyc_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DatingKycStatus" NOT NULL DEFAULT 'PENDING',
    "docType" "DatingKycDocType" NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "docFrontUrl" TEXT NOT NULL,
    "docBackUrl" TEXT,
    "reason" TEXT,
    "approvedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dating_kyc_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "likerId" TEXT NOT NULL,
    "likedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dating_kyc_requests_userId_key" ON "dating_kyc_requests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_likerId_likedId_key" ON "likes"("likerId", "likedId");

-- AddForeignKey
ALTER TABLE "dating_kyc_requests" ADD CONSTRAINT "dating_kyc_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_likerId_fkey" FOREIGN KEY ("likerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_likedId_fkey" FOREIGN KEY ("likedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
