/*
  Warnings:

  - Added the required column `location` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN "location" TEXT;
UPDATE "events" SET "location" = 'Unknown' WHERE "location" IS NULL;
ALTER TABLE "events" ALTER COLUMN "location" SET NOT NULL;
