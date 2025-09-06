-- AlterTable
ALTER TABLE "events" ADD COLUMN     "isExclusive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "exclusive_perks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exclusive_perks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_exclusive_perks" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "perkId" TEXT NOT NULL,

    CONSTRAINT "event_exclusive_perks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_exclusive_perks_eventId_perkId_key" ON "event_exclusive_perks"("eventId", "perkId");

-- AddForeignKey
ALTER TABLE "event_exclusive_perks" ADD CONSTRAINT "event_exclusive_perks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_exclusive_perks" ADD CONSTRAINT "event_exclusive_perks_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "exclusive_perks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
