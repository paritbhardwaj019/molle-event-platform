-- CreateEnum
CREATE TYPE "HostReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT;

-- CreateTable
CREATE TABLE "host_reports" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "HostReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportedHostId" TEXT NOT NULL,
    "reportingUserId" TEXT NOT NULL,

    CONSTRAINT "host_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "host_reports_reportedHostId_reportingUserId_key" ON "host_reports"("reportedHostId", "reportingUserId");

-- AddForeignKey
ALTER TABLE "host_reports" ADD CONSTRAINT "host_reports_reportedHostId_fkey" FOREIGN KEY ("reportedHostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_reports" ADD CONSTRAINT "host_reports_reportingUserId_fkey" FOREIGN KEY ("reportingUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
