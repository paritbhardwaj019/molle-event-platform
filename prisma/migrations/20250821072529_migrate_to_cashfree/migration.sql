/*
  Warnings:

  - You are about to drop the column `razorpayOrderId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPayoutId` on the `payouts` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayOrderId` on the `swipe_purchases` table. All the data in the column will be lost.
  - You are about to drop the column `razorpayPaymentId` on the `swipe_purchases` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cashfreeOrderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cashfreePaymentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cashfreePayoutId]` on the table `payouts` will be added. If there are existing duplicate values, this will fail.
*/

-- First, add the new columns as nullable
ALTER TABLE "payments" ADD COLUMN "cashfreeOrderId" TEXT;
ALTER TABLE "payments" ADD COLUMN "cashfreePaymentId" TEXT;

ALTER TABLE "payouts" ADD COLUMN "cashfreePayoutId" TEXT;

ALTER TABLE "swipe_purchases" ADD COLUMN "cashfreeOrderId" TEXT;
ALTER TABLE "swipe_purchases" ADD COLUMN "cashfreePaymentId" TEXT;

-- Migrate existing data (if any) - set a default value for existing records
UPDATE "payments" SET "cashfreeOrderId" = 'MIGRATED_' || "razorpayOrderId" WHERE "razorpayOrderId" IS NOT NULL;
UPDATE "payments" SET "cashfreePaymentId" = "razorpayPaymentId" WHERE "razorpayPaymentId" IS NOT NULL;

UPDATE "payouts" SET "cashfreePayoutId" = "razorpayPayoutId" WHERE "razorpayPayoutId" IS NOT NULL;

UPDATE "swipe_purchases" SET "cashfreeOrderId" = "razorpayOrderId" WHERE "razorpayOrderId" IS NOT NULL;
UPDATE "swipe_purchases" SET "cashfreePaymentId" = "razorpayPaymentId" WHERE "razorpayPaymentId" IS NOT NULL;

-- Now make the required columns NOT NULL
ALTER TABLE "payments" ALTER COLUMN "cashfreeOrderId" SET NOT NULL;

-- Drop old columns
ALTER TABLE "payments" DROP COLUMN "razorpayOrderId";
ALTER TABLE "payments" DROP COLUMN "razorpayPaymentId";

ALTER TABLE "payouts" DROP COLUMN "razorpayPayoutId";

ALTER TABLE "swipe_purchases" DROP COLUMN "razorpayOrderId";
ALTER TABLE "swipe_purchases" DROP COLUMN "razorpayPaymentId";

-- Drop old indexes
DROP INDEX IF EXISTS "payments_razorpayOrderId_key";
DROP INDEX IF EXISTS "payments_razorpayPaymentId_key";
DROP INDEX IF EXISTS "payouts_razorpayPayoutId_key";

-- AlterTable
ALTER TABLE "user_preferences" ALTER COLUMN "dailySwipeLimit" SET DEFAULT 20;

-- CreateIndex
CREATE UNIQUE INDEX "payments_cashfreeOrderId_key" ON "payments"("cashfreeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_cashfreePaymentId_key" ON "payments"("cashfreePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_cashfreePayoutId_key" ON "payouts"("cashfreePayoutId");
