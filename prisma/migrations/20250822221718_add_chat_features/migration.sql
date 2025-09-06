-- AlterTable
ALTER TABLE "user_host_conversations" ADD COLUMN     "archivedBy" TEXT[],
ADD COLUMN     "reportReason" TEXT,
ADD COLUMN     "reportTimestamp" TIMESTAMP(3),
ADD COLUMN     "reportedBy" TEXT;

-- AlterTable
ALTER TABLE "user_host_messages" ADD COLUMN     "attachments" JSONB;
