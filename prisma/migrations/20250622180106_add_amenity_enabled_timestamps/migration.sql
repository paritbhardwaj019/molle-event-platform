/*
  Warnings:

  - Added the required column `updatedAt` to the `amenities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "amenities" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
