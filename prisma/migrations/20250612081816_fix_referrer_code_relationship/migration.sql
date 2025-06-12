-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_referredByHostId_referrerCode_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "usedReferrerCodeId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_usedReferrerCodeId_fkey" FOREIGN KEY ("usedReferrerCodeId") REFERENCES "host_referrer_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
