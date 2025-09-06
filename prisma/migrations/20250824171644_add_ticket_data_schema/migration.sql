-- CreateTable
CREATE TABLE "ticket_data" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_data_bookingId_key" ON "ticket_data"("bookingId");

-- AddForeignKey
ALTER TABLE "ticket_data" ADD CONSTRAINT "ticket_data_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
