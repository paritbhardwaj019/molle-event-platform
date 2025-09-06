-- AlterTable
ALTER TABLE "subscription_packages" ADD COLUMN     "canSeeLikes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priorityMatching" BOOLEAN NOT NULL DEFAULT false;
