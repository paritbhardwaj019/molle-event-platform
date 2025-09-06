/*
  Warnings:

  - You are about to drop the column `adminNotes` on the `host_reports` table. All the data in the column will be lost.
  - You are about to drop the column `reportedHostId` on the `host_reports` table. All the data in the column will be lost.
  - You are about to drop the column `reportingUserId` on the `host_reports` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[hostId,reporterId]` on the table `host_reports` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hostId` to the `host_reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reporterId` to the `host_reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "host_reports" DROP CONSTRAINT "host_reports_reportedHostId_fkey";

-- DropForeignKey
ALTER TABLE "host_reports" DROP CONSTRAINT "host_reports_reportingUserId_fkey";

-- DropIndex
DROP INDEX "host_reports_reportedHostId_reportingUserId_key";

-- AlterTable
ALTER TABLE "host_reports" DROP COLUMN "adminNotes",
DROP COLUMN "reportedHostId",
DROP COLUMN "reportingUserId",
ADD COLUMN     "hostId" TEXT NOT NULL,
ADD COLUMN     "reporterId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_hostId_key" ON "follows"("followerId", "hostId");

-- CreateIndex
CREATE UNIQUE INDEX "host_reports_hostId_reporterId_key" ON "host_reports"("hostId", "reporterId");

-- AddForeignKey
ALTER TABLE "host_reports" ADD CONSTRAINT "host_reports_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_reports" ADD CONSTRAINT "host_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
