-- AlterTable
ALTER TABLE "amenities" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "city" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "streetAddress" TEXT;
