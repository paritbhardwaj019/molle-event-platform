/*
  Warnings:

  - The values [SIGNUP] on the enum `ReferralLinkType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "ReferralLinkType_new" AS ENUM ('EVENT');
ALTER TABLE "referral_links" ALTER COLUMN "type" TYPE "ReferralLinkType_new" USING ("type"::text::"ReferralLinkType_new");
ALTER TYPE "ReferralLinkType" RENAME TO "ReferralLinkType_old";
ALTER TYPE "ReferralLinkType_new" RENAME TO "ReferralLinkType";
DROP TYPE "ReferralLinkType_old";
COMMIT;

-- CreateTable
CREATE TABLE "kyc_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankBranch" TEXT NOT NULL,
    "eventCity" TEXT NOT NULL,
    "eventVenueDetails" TEXT NOT NULL,
    "eventVenueCapacity" TEXT NOT NULL,
    "willGetPermissions" BOOLEAN NOT NULL,
    "permissionsExplanation" TEXT,
    "willHaveSecurity" BOOLEAN NOT NULL,
    "securityDetails" TEXT,
    "agreeToAssessment" BOOLEAN NOT NULL DEFAULT false,
    "understandPayouts" BOOLEAN NOT NULL DEFAULT false,
    "agreeSafetyResponsibilities" BOOLEAN NOT NULL DEFAULT false,
    "aadharFrontUrl" TEXT NOT NULL,
    "aadharBackUrl" TEXT NOT NULL,
    "panFrontUrl" TEXT NOT NULL,
    "panBackUrl" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "adminReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "kyc_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "kyc_requests" ADD CONSTRAINT "kyc_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
